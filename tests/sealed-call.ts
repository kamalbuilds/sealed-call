import { assert } from "chai";
import { deriveCustomizablePoolAddress } from "@meteora-ag/cp-amm-sdk";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import {
  NATIVE_MINT,
  callPda,
  callState,
  callerClaimIx,
  claimIx,
  commitment,
  configPda,
  depositIx,
  expireIx,
  fetchCall,
  fetchCalls,
  fetchConfig,
  fetchPositions,
  initConfigIx,
  makeProgram,
  openCallIx,
  poolSides,
  positionPda,
  randomSalt,
  readPool,
  refundIx,
  revealAndSwapIx,
  setConfigIx,
  setPausedIx,
  spotOut,
  sweepDustIx,
  vaultPda,
  withComputeBudget,
  withdrawIx,
  type ConfigParams,
  type PoolInfo,
} from "../sdk/src/index";
import {
  accountExists,
  airdrop,
  chainTime,
  computeUnits,
  connection,
  createPool,
  expectFail,
  failure,
  lamports,
  loadKeypair,
  makeMeme,
  type MemeOpts,
  send,
  sleep,
  tokenBalance,
  waitUntilChainTime,
} from "./helpers";

const SOL = BigInt(LAMPORTS_PER_SOL);
const sol = (n: number) => BigInt(Math.round(n * LAMPORTS_PER_SOL));
const big = (b: BN) => BigInt(b.toString());
const LOCK_SECS = 5;

const program = makeProgram(connection);
const admin = loadKeypair("keys/test-admin.json");
const caller = Keypair.generate();
const f1 = Keypair.generate();
const f2 = Keypair.generate();
const f3 = Keypair.generate();
const cranker = Keypair.generate();
const stranger = Keypair.generate();
const treasury = Keypair.generate();
const poolFunder = Keypair.generate();

const CONFIG: ConfigParams = {
  treasury: treasury.publicKey,
  feeBps: 100,
  callerFeeShareBps: 3000,
  maxCallLamports: new BN(sol(50).toString()),
  maxDepositLamports: new BN(sol(20).toString()),
  minCallerStakeBps: 500,
  minCallerLockSecs: new BN(LOCK_SECS),
  maxRevealWindowSecs: new BN(259_200),
  maxPriceImpactBps: 2500,
  minLockedLiquidityBps: 8000,
  maxSwapReserveBps: 1000,
  minDepositLamports: new BN(1_000_000),
};

type Market = { mint: PublicKey; pool: PoolInfo; wsolIsA: boolean };
let deepX: Market; // wSOL is token A
let deepY: Market; // wSOL is token B
let thinT: Market;

let nextId = 1n;
const newId = () => nextId++;

type Call = { call: PublicKey; vault: PublicKey; id: bigint; mint: PublicKey; pool: PublicKey; salt: Uint8Array };

type OpenOpts = {
  who?: Keypair;
  commitMint: PublicKey;
  commitPool: PublicKey;
  salt?: Uint8Array;
  window?: number;
  lock?: number;
  maxVault: bigint;
  impact?: number;
  stake: bigint;
};

async function openCall(o: OpenOpts): Promise<Call> {
  const who = o.who ?? caller;
  const id = newId();
  const salt = o.salt ?? randomSalt();
  const ix = await openCallIx(program, {
    caller: who.publicKey,
    callId: id,
    commitment: commitment(callPda(who.publicKey, id), o.commitMint, o.commitPool, salt),
    revealWindowSecs: o.window ?? 3600,
    callerLockSecs: o.lock ?? LOCK_SECS,
    maxVaultLamports: o.maxVault,
    maxImpactBps: o.impact ?? 2500,
    callerStakeLamports: o.stake,
  });
  await send([ix], [who]);
  const call = callPda(who.publicKey, id);
  return { call, vault: vaultPda(call), id, mint: o.commitMint, pool: o.commitPool, salt };
}

const deposit = async (who: Keypair, c: Call, amount: bigint) =>
  send([await depositIx(program, who.publicKey, c.call, amount)], [who]);

async function reveal(c: Call, m: Market, who: Keypair = caller, minOutOverride?: bigint) {
  const acc = await fetchCall(program, c.call);
  const total = big(acc.callerStakeLamports) + big(acc.followerLamports);
  const lamportsIn = total - (total * 100n) / 10_000n;
  const live = await readPool(connection, m.pool.address);
  const minOut = minOutOverride ?? (spotOut(lamportsIn, live.sqrtPrice, m.wsolIsA) * 9n) / 10n;
  const ix = await revealAndSwapIx(program, {
    caller: who.publicKey,
    call: c.call,
    mint: c.mint,
    pool: c.pool,
    salt: c.salt,
    minimumAmountOut: minOut,
  });
  return withComputeBudget(400_000, [ix]);
}

async function txFee(sig: string): Promise<bigint> {
  const tx = await connection.getTransaction(sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
  assert.isNotNull(tx);
  return BigInt(tx!.meta!.fee);
}

/** Runs a rejected transaction and proves the vault, the call record and the listed wallets did not move. */
async function rejected(c: Call, wallets: PublicKey[], expected: string, ixs: Awaited<ReturnType<typeof reveal>>, signers: Keypair[]) {
  const before = await snapshot(c, wallets);
  await expectFail(ixs, signers, expected);
  assert.deepEqual(await snapshot(c, wallets), before, `state moved after ${expected}`);
}

async function snapshot(c: Call, wallets: PublicKey[]) {
  const acc = await program.account.call.fetchNullable(c.call, "confirmed");
  return {
    vault: await lamports(c.vault),
    wallets: await Promise.all(wallets.map((w) => lamports(w))),
    call: acc && { state: callState(acc), followers: acc.followerLamports.toString(), count: acc.followerCount, tokens: acc.tokensOut.toString() },
  };
}

describe("sealed_call against real Meteora DAMM v2 pools", function () {
  before(async function () {
    for (const k of [admin, caller, f1, f2, f3, cranker, stranger]) await airdrop(k.publicKey, 200);
    await airdrop(poolFunder.publicKey, 1000);

    const supply = 1_000_000_000_000_000n;
    const mkt = async (below: boolean, solLiq: bigint, tokLiq: bigint): Promise<Market> => {
      const { mint } = await makeMeme(poolFunder, { below, supply });
      const pool = await createPool(poolFunder, mint, solLiq, tokLiq);
      const { wsolIsA, mint: other } = poolSides(pool);
      assert.isTrue(other.equals(mint));
      assert.strictEqual(wsolIsA, !below, "pool orientation");
      return { mint, pool, wsolIsA };
    };
    deepX = await mkt(false, 300n * SOL, 250_000_000_000_000n);
    deepY = await mkt(true, 300n * SOL, 250_000_000_000_000n);
    thinT = await mkt(false, 5n * SOL, 5_000_000_000_000n);
    await sleep(3000); // pools must be strictly older than any call opened against them
  });

  describe("config", () => {
    it("init_config by a signer that is not the upgrade authority is rejected", async () => {
      const ix = await initConfigIx(program, stranger.publicKey, CONFIG);
      await expectFail([ix], [stranger], "Unauthorized");
      assert.isFalse(await accountExists(configPda()));
    });

    it("init_config by the upgrade authority stores every parameter", async () => {
      await send([await initConfigIx(program, admin.publicKey, CONFIG)], [admin]);
      const cfg = await fetchConfig(program);
      assert.isTrue(cfg.admin.equals(admin.publicKey));
      assert.isTrue(cfg.treasury.equals(treasury.publicKey));
      assert.strictEqual(cfg.feeBps, 100);
      assert.strictEqual(cfg.callerFeeShareBps, 3000);
      assert.strictEqual(cfg.maxPriceImpactBps, 2500);
      assert.strictEqual(cfg.minCallerStakeBps, 500);
      assert.strictEqual(cfg.minCallerLockSecs.toNumber(), LOCK_SECS);
      assert.isFalse(cfg.paused);
    });

    it("init_config cannot run twice", async () => {
      const ix = await initConfigIx(program, admin.publicKey, CONFIG);
      const f = await failure([ix], [admin]);
      assert.match(f.text, /already in use/);
    });
  });

  describe("happy path: one call, three followers, one transaction reveal", () => {
    const stake = sol(2);
    const deposits = [sol(3.333333337), sol(7.777777771), sol(12.000000013)];
    const followers = [f1, f2, f3];
    let c: Call;
    let total: bigint;
    let tokensOut: bigint;
    let claims: bigint[] = [];
    let executedAt: number;

    it("caller opens with stake, followers deposit different amounts", async () => {
      const callerBefore = await lamports(caller.publicKey);
      c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(40), stake });
      const reserve = BigInt(await connection.getMinimumBalanceForRentExemption(0));
      assert.strictEqual(await lamports(c.vault), stake + reserve);
      assert.isBelow(Number(await lamports(caller.publicKey)), Number(callerBefore - stake - reserve));

      for (let i = 0; i < 3; i++) await deposit(followers[i], c, deposits[i]);
      total = stake + deposits.reduce((a, b) => a + b, 0n);
      assert.strictEqual(await lamports(c.vault), total + reserve);
      const acc = await fetchCall(program, c.call);
      assert.strictEqual(callState(acc), "open");
      assert.strictEqual(acc.followerCount, 3);
      assert.strictEqual(big(acc.followerLamports), total - stake);
      for (let i = 0; i < 3; i++) {
        const pos = await program.account.position.fetch(positionPda(c.call, followers[i].publicKey), "confirmed");
        assert.strictEqual(big(pos.lamports), deposits[i]);
      }
    });

    it("fetchers list the call and its three positions from chain", async () => {
      const calls = await fetchCalls(program);
      assert.isTrue(calls.some((x) => x.publicKey.equals(c.call)));
      const positions = await fetchPositions(program, c.call);
      assert.strictEqual(positions.length, 3);
      assert.sameMembers(
        positions.map((p) => p.account.follower.toBase58()),
        followers.map((f) => f.publicKey.toBase58()),
      );
    });

    it("withdraw by a follower before execution refunds in full, a re-deposit restores the position", async () => {
      const before = await lamports(f3.publicKey);
      const posRent = await lamports(positionPda(c.call, f3.publicKey));
      const s = await send([await withdrawIx(program, f3.publicKey, c.call)], [f3]);
      const after = await lamports(f3.publicKey);
      assert.strictEqual(after - before, deposits[2] + posRent - (await txFee(s.sig)));
      assert.isFalse(await accountExists(positionPda(c.call, f3.publicKey)));
      assert.strictEqual(big((await fetchCall(program, c.call)).followerLamports), total - stake - deposits[2]);
      await deposit(f3, c, deposits[2]);
      assert.strictEqual(big((await fetchCall(program, c.call)).followerLamports), total - stake);
    });

    it("caller reveals in ONE transaction, fills at one price, fee goes to treasury and caller", async () => {
      const m = deepX;
      const reserve = BigInt(await connection.getMinimumBalanceForRentExemption(0));
      const fee = (total * 100n) / 10_000n;
      const callerFee = (fee * 3000n) / 10_000n;
      const treasuryFee = fee - callerFee;
      const lamportsIn = total - fee;

      const poolSolVault = m.wsolIsA ? m.pool.tokenAVault : m.pool.tokenBVault;
      const poolTokVault = m.wsolIsA ? m.pool.tokenBVault : m.pool.tokenAVault;
      const solVaultBefore = await tokenBalance(poolSolVault);
      const tokVaultBefore = await tokenBalance(poolTokVault);
      const treasuryBefore = await lamports(treasury.publicKey);
      const callerBefore = await lamports(caller.publicKey);

      const ixs = await reveal(c, m);
      const sent = await send(ixs, [caller]);
      const cu = await computeUnits(sent.sig);
      console.log(`KILLGATE cu=${cu} size=${sent.size} followers=3`);
      assert.isBelow(cu, 400_000);
      assert.isAtMost(sent.size, 1232);

      const acc = await fetchCall(program, c.call);
      assert.strictEqual(callState(acc), "executed");
      tokensOut = big(acc.tokensOut);
      executedAt = acc.executedAt.toNumber();
      assert.isTrue(acc.revealedMint.equals(m.mint));
      assert.isTrue(acc.revealedPool.equals(m.pool.address));
      assert.strictEqual(big(acc.lamportsIn), lamportsIn);

      const vaultOut = getAssociatedTokenAddressSync(m.mint, c.vault, true);
      assert.strictEqual(await tokenBalance(vaultOut), tokensOut, "tokens_out equals the vault output balance");
      assert.isAbove(Number(tokensOut), 0);

      assert.strictEqual((await lamports(treasury.publicKey)) - treasuryBefore, treasuryFee, "treasury fee");
      const outRent = await lamports(vaultOut);
      const callerDelta = (await lamports(caller.publicKey)) - callerBefore;
      assert.strictEqual(callerDelta, callerFee + reserve - outRent - (await txFee(sent.sig)), "caller fee and reserve");
      assert.strictEqual(await lamports(c.vault), 0n, "vault SOL fully paid out");
      assert.isFalse(await accountExists(getAssociatedTokenAddressSync(NATIVE_MINT, c.vault, true)), "wSOL ATA closed");

      assert.strictEqual((await tokenBalance(poolSolVault)) - solVaultBefore, lamportsIn, "pool received the swapped SOL");
      assert.strictEqual(tokVaultBefore - (await tokenBalance(poolTokVault)), tokensOut, "pool paid out tokens_out");

      const spot = spotOut(lamportsIn, m.pool.sqrtPrice, m.wsolIsA);
      assert.isAtMost(Number(tokensOut), Number(spot), "fee and curve only make the fill worse than spot");
      assert.isAtLeast(Number(tokensOut), Number((spot * 7500n) / 10_000n));
    });

    it("withdraw after execution is rejected with WrongState, balances unchanged", async () => {
      await rejected(
        c,
        [f3.publicKey],
        "WrongState",
        [await withdrawIx(program, f3.publicKey, c.call)],
        [f3],
      );
    });

    it("caller_claim before the lock reverts, followers claim floor(tokens_out * lamports / total)", async () => {
      await rejected(c, [caller.publicKey], "CallerLockActive", [await callerClaimIx(program, caller.publicKey, c.call)], [caller]);

      for (let i = 0; i < 3; i++) {
        const f = followers[i];
        const ata = getAssociatedTokenAddressSync(deepX.mint, f.publicKey);
        assert.isFalse(await accountExists(ata));
        await send([await claimIx(program, f.publicKey, c.call)], [f]);
        const got = await tokenBalance(ata);
        claims.push(got);
        assert.strictEqual(got, (tokensOut * deposits[i]) / total, `follower ${i} claim`);
        assert.isFalse(await accountExists(positionPda(c.call, f.publicKey)), "position closed");
      }
    });

    it("double claim fails and moves nothing", async () => {
      const ata = getAssociatedTokenAddressSync(deepX.mint, f1.publicKey);
      const before = await tokenBalance(ata);
      const vaultOut = getAssociatedTokenAddressSync(deepX.mint, c.vault, true);
      const vaultBefore = await tokenBalance(vaultOut);
      const f = await failure([await claimIx(program, f1.publicKey, c.call)], [f1]);
      assert.strictEqual(f.name, "AccountNotInitialized");
      assert.strictEqual(await tokenBalance(ata), before);
      assert.strictEqual(await tokenBalance(vaultOut), vaultBefore);
    });

    it("caller_claim succeeds after the lock and a second one is AlreadyClaimed", async () => {
      await waitUntilChainTime(executedAt + LOCK_SECS + 1);
      const ata = getAssociatedTokenAddressSync(deepX.mint, caller.publicKey);
      await send([await callerClaimIx(program, caller.publicKey, c.call)], [caller]);
      const got = await tokenBalance(ata);
      claims.push(got);
      assert.strictEqual(got, (tokensOut * stake) / total, "caller claim");
      await rejected(c, [caller.publicKey], "AlreadyClaimed", [await callerClaimIx(program, caller.publicKey, c.call)], [caller]);
    });

    it("every claimant got the same price within one token unit, claims never exceed tokens_out", async () => {
      assert.strictEqual(claims.length, 4);
      const order = [deposits[0], deposits[1], deposits[2], stake];
      const sum = claims.reduce((a, b) => a + b, 0n);
      assert.isAtMost(Number(sum), Number(tokensOut));
      for (let i = 0; i < 4; i++) {
        // |claim - tokens_out * lamports / total| < 1  <=>  0 <= tokens_out * lamports - claim * total < total
        const rem = tokensOut * order[i] - claims[i] * total;
        assert.isTrue(rem >= 0n && rem < total, `claimant ${i} off by more than one token unit`);
      }
      const vaultOut = getAssociatedTokenAddressSync(deepX.mint, c.vault, true);
      const dust = tokensOut - sum;
      assert.strictEqual(await tokenBalance(vaultOut), dust);
      assert.isAbove(Number(dust), 0, "amounts chosen so rounding leaves dust to sweep");
      assert.isBelow(Number(dust), 5);
    });

    it("sweep_dust by a non-admin is rejected, by the admin leaves the vault output at 0", async () => {
      await expectFail([await sweepDustIx(program, stranger.publicKey, c.call)], [stranger], "Unauthorized");
      const vaultOut = getAssociatedTokenAddressSync(deepX.mint, c.vault, true);
      const dust = await tokenBalance(vaultOut);
      await send([await sweepDustIx(program, admin.publicKey, c.call)], [admin]);
      assert.strictEqual(await tokenBalance(vaultOut), 0n);
      assert.strictEqual(await tokenBalance(getAssociatedTokenAddressSync(deepX.mint, treasury.publicKey, true)), dust);
      await expectFail([await sweepDustIx(program, admin.publicKey, c.call)], [admin], "NothingToSweep");
    });
  });

  describe("happy path on the reversed pool orientation (wSOL is token B)", () => {
    it("fills, matches the output balance and pays pro-rata claims", async () => {
      const stake = sol(1);
      const dep = sol(4.000000007);
      const c = await openCall({ commitMint: deepY.mint, commitPool: deepY.pool.address, maxVault: sol(10), stake });
      await deposit(f1, c, dep);
      const sent = await send(await reveal(c, deepY), [caller]);
      console.log(`KILLGATE-REVERSED cu=${await computeUnits(sent.sig)} size=${sent.size} followers=1`);
      const acc = await fetchCall(program, c.call);
      const T = big(acc.tokensOut);
      assert.strictEqual(await tokenBalance(getAssociatedTokenAddressSync(deepY.mint, c.vault, true)), T);
      await send([await claimIx(program, f1.publicKey, c.call)], [f1]);
      assert.strictEqual(await tokenBalance(getAssociatedTokenAddressSync(deepY.mint, f1.publicKey)), (T * dep) / (stake + dep));
      const lamportsIn = big(acc.lamportsIn);
      assert.isAtLeast(Number(T), Number((spotOut(lamportsIn, deepY.pool.sqrtPrice, false) * 7500n) / 10_000n));
    });
  });

  describe("negatives", () => {
    it("wrong salt reverts with HashMismatch", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      const wrong = { ...c, salt: randomSalt() };
      await rejected(c, [f1.publicKey, caller.publicKey], "HashMismatch", await reveal(wrong, deepX), [caller]);
      assert.strictEqual(callState(await fetchCall(program, c.call)), "open");
    });

    it("commitment to (mintX, pool of mintY) reverts with PoolMintMismatch", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepY.pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      await rejected(c, [f1.publicKey, caller.publicKey], "PoolMintMismatch", await reveal(c, deepY), [caller]);
    });

    it("an account that is not a DAMM v2 pool reverts with NotDammPool", async () => {
      const notPool = deepX.mint;
      const c = await openCall({ commitMint: deepX.mint, commitPool: notPool, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      const ix = await revealAndSwapIx(program, {
        caller: caller.publicKey,
        call: c.call,
        mint: c.mint,
        pool: notPool,
        salt: c.salt,
        minimumAmountOut: 1,
        poolVaults: { tokenAVault: deepX.pool.tokenAVault, tokenBVault: deepX.pool.tokenBVault },
      });
      await rejected(c, [f1.publicKey, caller.publicKey], "NotDammPool", withComputeBudget(400_000, [ix]), [caller]);
    });

    it("thin pool with max_impact_bps 100 reverts with PriceImpactExceeded, a permissive tolerance fills", async () => {
      const thinTokenVault = thinT.wsolIsA ? thinT.pool.tokenBVault : thinT.pool.tokenAVault;
      const strict = await openCall({ commitMint: thinT.mint, commitPool: thinT.pool.address, maxVault: sol(1), stake: sol(0.3), impact: 100 });
      await deposit(f1, strict, sol(0.1));
      const before = await tokenBalance(thinTokenVault);
      await rejected(strict, [f1.publicKey, caller.publicKey], "PriceImpactExceeded", await reveal(strict, thinT, caller, 1n), [caller]);
      assert.strictEqual(await tokenBalance(thinTokenVault), before, "pool untouched");

      const loose = await openCall({ commitMint: thinT.mint, commitPool: thinT.pool.address, maxVault: sol(0.5), stake: sol(0.25), impact: 2500 });
      await deposit(f2, loose, sol(0.1));
      await send(await reveal(loose, thinT), [caller]);
      assert.strictEqual(callState(await fetchCall(program, loose.call)), "executed");
    });

    it("a batch above 10% of the pool's wSOL reserve reverts with PoolTooThin", async () => {
      const c = await openCall({ commitMint: thinT.mint, commitPool: thinT.pool.address, maxVault: sol(10), stake: sol(2) });
      await deposit(f1, c, sol(2));
      await rejected(c, [f1.publicKey, caller.publicKey], "PoolTooThin", await reveal(c, thinT, caller, 1n), [caller]);
    });

    it("a deposit below min_deposit_lamports reverts with DepositTooSmall", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake: sol(1) });
      await rejected(c, [f1.publicKey], "DepositTooSmall", [await depositIx(program, f1.publicKey, c.call, 1)], [f1]);
      assert.isFalse(await accountExists(positionPda(c.call, f1.publicKey)));
      assert.strictEqual((await fetchCall(program, c.call)).followerCount, 0);
    });

    it("a commitment copied into another caller's call reverts with HashMismatch", async () => {
      const original = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake: sol(1) });
      const originalCall = await fetchCall(program, original.call);
      const rawCopy = await openCallIx(program, {
        caller: caller.publicKey,
        callId: 9_000_001,
        commitment: Uint8Array.from(originalCall.commitment),
        revealWindowSecs: 3600,
        callerLockSecs: LOCK_SECS,
        maxVaultLamports: sol(10),
        maxImpactBps: 2500,
        callerStakeLamports: sol(1),
      });
      await send([rawCopy], [caller]);
      assert.deepEqual(
        Array.from((await fetchCall(program, callPda(caller.publicKey, 9_000_001))).commitment),
        Array.from(originalCall.commitment),
        "the copy carries the original's commitment bytes",
      );
      const verbatim: Call = { call: callPda(caller.publicKey, 9_000_001), vault: vaultPda(callPda(caller.publicKey, 9_000_001)), id: 9_000_001n, mint: deepX.mint, pool: deepX.pool.address, salt: original.salt };
      await deposit(f2, verbatim, sol(1));
      await rejected(verbatim, [f2.publicKey, caller.publicKey], "HashMismatch", await reveal(verbatim, deepX), [caller]);
    });

    it("minimum_amount_out 0 reverts with MinOutZero", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      await rejected(c, [f1.publicKey, caller.publicKey], "MinOutZero", await reveal(c, deepX, caller, 0n), [caller]);
    });

    it("a non-caller reveal reverts with Unauthorized", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      await rejected(c, [f1.publicKey, f2.publicKey], "Unauthorized", await reveal(c, deepX, f2), [f2]);
    });

    it("the caller cannot deposit into the own call", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake: sol(1) });
      await rejected(c, [caller.publicKey], "CallerCannotDeposit", [await depositIx(program, caller.publicKey, c.call, sol(1))], [caller]);
    });

    it("per-follower cap and vault cap", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(12), stake: sol(1) });
      await rejected(c, [f1.publicKey], "DepositCapExceeded", [await depositIx(program, f1.publicKey, c.call, sol(20) + 1n)], [f1]);
      await deposit(f1, c, sol(8));
      await rejected(c, [f2.publicKey], "VaultCapExceeded", [await depositIx(program, f2.publicKey, c.call, sol(5))], [f2]);
      await rejected(c, [f1.publicKey], "DepositCapExceeded", [await depositIx(program, f1.publicKey, c.call, sol(12.5))], [f1]);
    });

    it("opening with a stake below the minimum, above the vault, or a vault above the cap is rejected", async () => {
      const open = async (maxVault: bigint, stake: bigint) => {
        const id = newId();
        return openCallIx(program, {
          caller: caller.publicKey,
          callId: id,
          commitment: commitment(callPda(caller.publicKey, id), deepX.mint, deepX.pool.address, randomSalt()),
          revealWindowSecs: 3600,
          callerLockSecs: LOCK_SECS,
          maxVaultLamports: maxVault,
          maxImpactBps: 2500,
          callerStakeLamports: stake,
        });
      };
      const before = await lamports(caller.publicKey);
      await expectFail([await open(sol(10), sol(0.1))], [caller], "StakeTooLow");
      await expectFail([await open(sol(10), sol(11))], [caller], "StakeAboveVault");
      await expectFail([await open(sol(60), sol(5))], [caller], "VaultCapTooHigh");
      assert.strictEqual(await lamports(caller.publicKey), before);
    });

    it("claim before execution is rejected and moves nothing", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      const before = await snapshot(c, [f1.publicKey]);
      const f = await failure([await claimIx(program, f1.publicKey, c.call)], [f1]);
      assert.strictEqual(f.name, "AccountOwnedByWrongProgram", "revealed_mint is unset before execution, so the mint account fails to deserialize");
      assert.deepEqual(await snapshot(c, [f1.publicKey]), before);
      assert.isTrue(await accountExists(positionPda(c.call, f1.publicKey)));
    });
  });

  describe("pool and mint hygiene", () => {
    const fresh = async (opts: MemeOpts, solLiq = 50n * SOL) => {
      const { mint, program: mintProgram } = await makeMeme(poolFunder, opts);
      return { mint, mintProgram, solLiq };
    };

    it("a pool the caller created after the call opened reverts with PoolNotSeasoned, followers withdraw in full", async () => {
      const { mint } = await fresh({ below: false, supply: 1_000_000_000_000_000n });
      const poolAddress = deriveCustomizablePoolAddress(mint, NATIVE_MINT);
      const c = await openCall({ commitMint: mint, commitPool: poolAddress, maxVault: sol(10), stake: sol(1), impact: 100 });
      await deposit(f1, c, sol(2));
      const pool = await createPool(poolFunder, mint, 50n * SOL, 50_000_000_000_000n);
      assert.isTrue(pool.address.equals(poolAddress));
      const m: Market = { mint, pool, wsolIsA: poolSides(pool).wsolIsA };
      await rejected(c, [f1.publicKey, caller.publicKey], "PoolNotSeasoned", await reveal(c, m), [caller]);

      const posRent = await lamports(positionPda(c.call, f1.publicKey));
      const before = await lamports(f1.publicKey);
      const s = await send([await withdrawIx(program, f1.publicKey, c.call)], [f1]);
      assert.strictEqual((await lamports(f1.publicKey)) - before, sol(2) + posRent - (await txFee(s.sig)), "withdraw returns every lamport");
    });

    it("a seasoned pool with unlocked liquidity reverts with PoolLiquidityUnlocked", async () => {
      const { mint } = await fresh({ below: true, supply: 1_000_000_000_000_000n });
      const pool = await createPool(poolFunder, mint, 50n * SOL, 50_000_000_000_000n, { lockLiquidity: false });
      await sleep(3000);
      const m: Market = { mint, pool, wsolIsA: poolSides(pool).wsolIsA };
      const c = await openCall({ commitMint: mint, commitPool: pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      await rejected(c, [f1.publicKey, caller.publicKey], "PoolLiquidityUnlocked", await reveal(c, m, caller, 1n), [caller]);
    });

    it("the same pool with locked liquidity fills, so the lock is the only difference", async () => {
      const { mint } = await fresh({ below: true, supply: 1_000_000_000_000_000n });
      const pool = await createPool(poolFunder, mint, 50n * SOL, 50_000_000_000_000n);
      await sleep(3000);
      const m: Market = { mint, pool, wsolIsA: poolSides(pool).wsolIsA };
      const c = await openCall({ commitMint: mint, commitPool: pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      await send(await reveal(c, m), [caller]);
      assert.strictEqual(callState(await fetchCall(program, c.call)), "executed");
    });

    for (const [label, opts] of [
      ["a live mint authority", { mintAuthorityLive: true }],
      ["a freeze authority", { freezeAuthority: poolFunder.publicKey }],
    ] as const) {
      it(`an output mint with ${label} reverts with MintAuthorityLive`, async () => {
        const { mint } = await fresh({ below: false, supply: 1_000_000_000_000_000n, ...opts });
        const pool = await createPool(poolFunder, mint, 50n * SOL, 50_000_000_000_000n);
        await sleep(3000);
        const m: Market = { mint, pool, wsolIsA: poolSides(pool).wsolIsA };
        const c = await openCall({ commitMint: mint, commitPool: pool.address, maxVault: sol(10), stake: sol(1) });
        await deposit(f1, c, sol(2));
        await rejected(c, [f1.publicKey, caller.publicKey], "MintAuthorityLive", await reveal(c, m, caller, 1n), [caller]);
      });
    }

    it("a Token-2022 mint with a TransferFeeConfig extension reverts with UnsafeMintExtension", async () => {
      const { mint, mintProgram } = await fresh({ below: false, supply: 1_000_000_000_000_000n, transferFeeBps: 0 });
      const pool = await createPool(poolFunder, mint, 50n * SOL, 50_000_000_000_000n, { mintProgram });
      await sleep(3000);
      const m: Market = { mint, pool, wsolIsA: poolSides(pool).wsolIsA };
      const c = await openCall({ commitMint: mint, commitPool: pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      await rejected(c, [f1.publicKey, caller.publicKey], "UnsafeMintExtension", await reveal(c, m, caller, 1n), [caller]);
    });
  });

  describe("fee terms are fixed at open", () => {
    it("set_config after deposits does not change that call's fee split", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));
      const hostile: ConfigParams = { ...CONFIG, feeBps: 300, callerFeeShareBps: 10_000 };
      await send([await setConfigIx(program, admin.publicKey, hostile)], [admin]);
      try {
        assert.strictEqual((await fetchConfig(program)).feeBps, 300);
        const total = sol(3);
        const fee = (total * 100n) / 10_000n;
        const treasuryFee = fee - (fee * 3000n) / 10_000n;
        const treasuryBefore = await lamports(treasury.publicKey);
        await send(await reveal(c, deepX), [caller]);
        assert.strictEqual((await lamports(treasury.publicKey)) - treasuryBefore, treasuryFee);
        assert.strictEqual(big((await fetchCall(program, c.call)).lamportsIn), total - fee);
      } finally {
        await send([await setConfigIx(program, admin.publicKey, CONFIG)], [admin]);
      }
      assert.strictEqual((await fetchConfig(program)).feeBps, 100);
    });
  });

  describe("expiry", () => {
    it("after the deadline reveal reverts, refunds return every lamport, expire returns stake and reserve", async () => {
      const stake = sol(1);
      const deps = [sol(2.5), sol(3.25)];
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake, window: 8 });
      await deposit(f1, c, deps[0]);
      await deposit(f2, c, deps[1]);
      const deadline = (await fetchCall(program, c.call)).revealDeadline.toNumber();

      await expectFail([await refundIx(program, c.call, f1.publicKey)], [cranker], "DeadlineNotPassed");
      await waitUntilChainTime(deadline + 1);

      await rejected(c, [f1.publicKey, f2.publicKey], "DeadlinePassed", await reveal(c, deepX), [caller]);
      await rejected(c, [f3.publicKey], "DeadlinePassed", [await depositIx(program, f3.publicKey, c.call, sol(1))], [f3]);
      await expectFail([await expireIx(program, c.call)], [cranker], "FollowersRemain");

      const reserve = BigInt(await connection.getMinimumBalanceForRentExemption(0));
      const fs = [f1, f2];
      for (let i = 0; i < 2; i++) {
        const posRent = await lamports(positionPda(c.call, fs[i].publicKey));
        const before = await lamports(fs[i].publicKey);
        await send([await refundIx(program, c.call, fs[i].publicKey)], [cranker]);
        assert.strictEqual((await lamports(fs[i].publicKey)) - before, deps[i] + posRent, `follower ${i} gets deposit and position rent back`);
        assert.isFalse(await accountExists(positionPda(c.call, fs[i].publicKey)));
      }
      assert.strictEqual(await lamports(c.vault), stake + reserve);

      const callerBefore = await lamports(caller.publicKey);
      await send([await expireIx(program, c.call)], [cranker]);
      assert.strictEqual((await lamports(caller.publicKey)) - callerBefore, stake + reserve, "caller gets stake and reserve");
      assert.strictEqual(await lamports(c.vault), 0n);
      assert.strictEqual(callState(await fetchCall(program, c.call)), "expired");
    });
  });

  describe("pause", () => {
    it("blocks open, deposit and reveal while withdraw still works; only the admin may pause", async () => {
      const c = await openCall({ commitMint: deepX.mint, commitPool: deepX.pool.address, maxVault: sol(10), stake: sol(1) });
      await deposit(f1, c, sol(2));

      await expectFail([await setPausedIx(program, stranger.publicKey, true)], [stranger], "Unauthorized");
      assert.isFalse((await fetchConfig(program)).paused);

      await send([await setPausedIx(program, admin.publicKey, true)], [admin]);
      assert.isTrue((await fetchConfig(program)).paused);
      try {
        const pausedId = newId();
        const openIx = await openCallIx(program, {
          caller: caller.publicKey,
          callId: pausedId,
          commitment: commitment(callPda(caller.publicKey, pausedId), deepX.mint, deepX.pool.address, randomSalt()),
          revealWindowSecs: 3600,
          callerLockSecs: LOCK_SECS,
          maxVaultLamports: sol(10),
          maxImpactBps: 2500,
          callerStakeLamports: sol(1),
        });
        await expectFail([openIx], [caller], "Paused");
        await rejected(c, [f2.publicKey], "Paused", [await depositIx(program, f2.publicKey, c.call, sol(1))], [f2]);
        await rejected(c, [caller.publicKey, f1.publicKey], "Paused", await reveal(c, deepX), [caller]);

        const posRent = await lamports(positionPda(c.call, f1.publicKey));
        const before = await lamports(f1.publicKey);
        const s = await send([await withdrawIx(program, f1.publicKey, c.call)], [f1]);
        assert.strictEqual((await lamports(f1.publicKey)) - before, sol(2) + posRent - (await txFee(s.sig)), "withdraw pays out while paused");
      } finally {
        await send([await setPausedIx(program, admin.publicKey, false)], [admin]);
      }
      assert.isFalse((await fetchConfig(program)).paused);
    });
  });
});
