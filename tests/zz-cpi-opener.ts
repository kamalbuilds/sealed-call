import { assert } from "chai";
import { sha256 } from "@noble/hashes/sha256";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";

import {
  PROGRAM_ID,
  callPda,
  callState,
  commitment,
  configPda,
  fetchCall,
  fetchConfig,
  initConfigIx,
  makeProgram,
  randomSalt,
  vaultPda,
  type ConfigParams,
} from "../sdk/src/index";
import { accountExists, airdrop, connection, expectFail, lamports, loadKeypair, send } from "./helpers";

const OPENER_ID = new PublicKey("4SGjnSXNiXNMaoy3wUeW3N3qn8LkZ72XsxT3MenyoD5Z");
const SOL = BigInt(LAMPORTS_PER_SOL);

const program = makeProgram(connection);
const admin = loadKeypair("keys/test-admin.json");
const owner = Keypair.generate();

const openerPda = (who: PublicKey): PublicKey =>
  PublicKey.findProgramAddressSync([Buffer.from("opener"), who.toBuffer()], OPENER_ID)[0];

const u64 = (v: bigint) => new BN(v.toString()).toArrayLike(Buffer, "le", 8);
const i64 = (v: bigint) => new BN(v.toString()).toTwos(64).toArrayLike(Buffer, "le", 8);
const u16 = (v: number) => new BN(v).toArrayLike(Buffer, "le", 2);

type Args = {
  callId: bigint;
  commitment: Uint8Array;
  revealWindowSecs: bigint;
  callerLockSecs: bigint;
  maxVaultLamports: bigint;
  maxImpactBps: number;
  callerStakeLamports: bigint;
};

/** `callOwner` is the key the call PDA is derived from; it is the opener PDA unless a test overrides it. */
function openFromPdaIx(who: PublicKey, a: Args, callOwner: PublicKey = openerPda(who)): TransactionInstruction {
  const call = callPda(callOwner, a.callId);
  const data = Buffer.concat([
    Buffer.from(sha256(Buffer.from("global:open_from_pda")).subarray(0, 8)),
    u64(a.callId),
    Buffer.from(a.commitment),
    i64(a.revealWindowSecs),
    i64(a.callerLockSecs),
    u64(a.maxVaultLamports),
    u16(a.maxImpactBps),
    u64(a.callerStakeLamports),
  ]);
  return new TransactionInstruction({
    programId: OPENER_ID,
    keys: [
      { pubkey: who, isSigner: true, isWritable: true },
      { pubkey: openerPda(who), isSigner: false, isWritable: true },
      { pubkey: configPda(), isSigner: false, isWritable: false },
      { pubkey: call, isSigner: false, isWritable: true },
      { pubkey: vaultPda(call), isSigner: false, isWritable: true },
      { pubkey: PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

describe("cpi_opener opens a sealed call from a PDA caller", function () {
  let args: (id: bigint) => Args;

  before(async function () {
    await airdrop(owner.publicKey, 20);
    await airdrop(admin.publicKey, 5);
    assert.isNotNull(await connection.getAccountInfo(OPENER_ID, "confirmed"), "cpi_opener is not deployed on the validator");

    if (!(await accountExists(configPda()))) {
      const defaults: ConfigParams = {
        treasury: Keypair.generate().publicKey,
        feeBps: 100,
        callerFeeShareBps: 3000,
        maxCallLamports: new BN((50n * SOL).toString()),
        maxDepositLamports: new BN((20n * SOL).toString()),
        minCallerStakeBps: 500,
        minCallerLockSecs: new BN(5),
        maxRevealWindowSecs: new BN(259_200),
        maxPriceImpactBps: 2500,
        minLockedLiquidityBps: 8000,
        maxSwapReserveBps: 1000,
        minDepositLamports: new BN(1_000_000),
      };
      await send([await initConfigIx(program, admin.publicKey, defaults)], [admin]);
    }
    const cfg = await fetchConfig(program);
    args = (id) => ({
      callId: id,
      commitment: commitment(callPda(openerPda(owner.publicKey), id), Keypair.generate().publicKey, Keypair.generate().publicKey, randomSalt()),
      revealWindowSecs: 3600n,
      callerLockSecs: BigInt(cfg.minCallerLockSecs.toString()),
      maxVaultLamports: 10n * SOL,
      maxImpactBps: Math.min(2500, cfg.maxPriceImpactBps),
      callerStakeLamports: 1n * SOL,
    });
    assert.isFalse(cfg.paused, "config is paused");
    assert.isTrue(BigInt(cfg.maxCallLamports.toString()) >= 10n * SOL);
  });

  it("opens a call whose caller is the opener PDA, funded by the PDA, signed with invoke_signed", async () => {
    const opener = openerPda(owner.publicKey);
    const a = args(1n);
    const call = callPda(opener, a.callId);
    const vault = vaultPda(call);
    assert.isFalse(await accountExists(call));
    assert.strictEqual(await lamports(opener), 0n, "opener PDA starts empty");

    await send([openFromPdaIx(owner.publicKey, a)], [owner]);

    const acc = await fetchCall(program, call);
    assert.isTrue(acc.caller.equals(opener), "caller is the PDA");
    assert.isFalse(acc.caller.equals(owner.publicKey));
    assert.strictEqual(callState(acc), "open");
    assert.strictEqual(acc.callId.toString(), a.callId.toString());
    assert.deepEqual(Array.from(acc.commitment), Array.from(a.commitment));
    assert.strictEqual(acc.callerStakeLamports.toString(), a.callerStakeLamports.toString());

    const info = await connection.getAccountInfo(call, "confirmed");
    assert.isTrue(info!.owner.equals(PROGRAM_ID), "call account is owned by sealed_call");

    const reserve = BigInt(await connection.getMinimumBalanceForRentExemption(0));
    assert.strictEqual(await lamports(vault), a.callerStakeLamports + reserve, "vault holds the stake plus rent reserve");
    assert.strictEqual(await lamports(opener), reserve, "opener PDA keeps exactly its own rent-exempt reserve");
  });

  it("the same PDA opens a second call", async () => {
    const opener = openerPda(owner.publicKey);
    const a = args(2n);
    await send([openFromPdaIx(owner.publicKey, a)], [owner]);
    const acc = await fetchCall(program, callPda(opener, a.callId));
    assert.isTrue(acc.caller.equals(opener));
    assert.strictEqual(callState(acc), "open");
  });

  it("a call PDA not derived from the opener is rejected and creates nothing", async () => {
    const a = args(3n);
    const wrong = callPda(owner.publicKey, a.callId);
    await expectFail([openFromPdaIx(owner.publicKey, a, owner.publicKey)], [owner], "ConstraintSeeds");
    assert.isFalse(await accountExists(wrong));
    assert.isFalse(await accountExists(callPda(openerPda(owner.publicKey), a.callId)));
  });
});
