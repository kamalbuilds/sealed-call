import { assert } from "chai";
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
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
  fetchCall,
  fetchConfig,
  initConfigIx,
  makeProgram,
  openCallIx,
  randomSalt,
  revealAndSwapIx,
  vaultPda,
  withComputeBudget,
  type ConfigParams,
} from "../sdk/src/index";
import { commitmentDbc, dbcSpotOut, decodeDbcPool, readDbcPool, revealAndSwapDbcIx, type DbcPoolInfo } from "../sdk/src/dbc";
import { accountExists, airdrop, computeUnits, connection, createPool, expectFail, failure, lamports, loadKeypair, makeMeme, send, sleep, tokenBalance, waitUntilChainTime } from "./helpers";
import { createDbcLaunch, dbcBuy, dbcFillCurve, dbcQuote, planDbcLaunch, type DbcLaunch, type LaunchPlan } from "./helpers-dbc";

const sol = (n: number) => BigInt(Math.round(n * LAMPORTS_PER_SOL));
const big = (b: BN) => BigInt(b.toString());
const LOCK_SECS = 5;

const program = makeProgram(connection);
const admin = loadKeypair("keys/test-admin.json");
const launcher = Keypair.generate();
const caller = Keypair.generate();
const f1 = Keypair.generate();
const f2 = Keypair.generate();
const f3 = Keypair.generate();
const racers = [Keypair.generate(), Keypair.generate(), Keypair.generate(), Keypair.generate()];

const CONFIG: ConfigParams = {
  treasury: Keypair.generate().publicKey,
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

// a curve with ~70 SOL of room: a 3.6 SOL vault moves the price a few percent, not the whole curve
const CURVE = { initialMarketCap: 30, migrationMarketCap: 300 };

let nextId = 5_000n;
type Call = { call: PublicKey; vault: PublicKey; mint: PublicKey; pool: PublicKey; salt: Uint8Array };

async function openDbcCall(o: {
  mint: PublicKey;
  pool: PublicKey;
  stake: bigint;
  maxVault: bigint;
  impact?: number;
  hash?: (call: PublicKey, salt: Uint8Array) => Uint8Array;
}): Promise<Call> {
  const id = nextId++;
  const salt = randomSalt();
  const call = callPda(caller.publicKey, id);
  const hash = o.hash ?? ((c, s) => commitmentDbc(c, o.mint, o.pool, s));
  await send(
    [
      await openCallIx(program, {
        caller: caller.publicKey,
        callId: id,
        commitment: hash(call, salt),
        revealWindowSecs: 3600,
        callerLockSecs: LOCK_SECS,
        maxVaultLamports: o.maxVault,
        maxImpactBps: o.impact ?? 2500,
        callerStakeLamports: o.stake,
      }),
    ],
    [caller],
  );
  return { call, vault: vaultPda(call), mint: o.mint, pool: o.pool, salt };
}

const deposit = async (who: Keypair, c: Call, amount: bigint) => send([await depositIx(program, who.publicKey, c.call, amount)], [who]);

async function lamportsIn(c: Call): Promise<bigint> {
  const acc = await fetchCall(program, c.call);
  const total = big(acc.callerStakeLamports) + big(acc.followerLamports);
  return total - (total * 100n) / 10_000n;
}

async function revealDbc(c: Call, o: { minOut?: bigint; poolInfo?: (i: DbcPoolInfo) => DbcPoolInfo } = {}) {
  const info = await readDbcPool(connection, c.pool);
  const minOut = o.minOut ?? ((await dbcQuote(c.pool, await lamportsIn(c))).out * 99n) / 100n;
  const ix = await revealAndSwapDbcIx(program, {
    caller: caller.publicKey,
    call: c.call,
    mint: c.mint,
    pool: c.pool,
    salt: c.salt,
    minimumAmountOut: minOut,
    poolInfo: o.poolInfo ? o.poolInfo(info) : info,
  });
  return withComputeBudget(400_000, [ix]);
}

async function snapshot(c: Call, wallets: PublicKey[]) {
  const acc = await program.account.call.fetchNullable(c.call, "confirmed");
  return {
    vault: await lamports(c.vault),
    wallets: await Promise.all(wallets.map((w) => lamports(w))),
    call: acc && { state: callState(acc), followers: acc.followerLamports.toString(), tokens: acc.tokensOut.toString() },
  };
}

/** Runs a rejected transaction and proves the vault, the call record and the caller did not move. */
async function rejected(c: Call, expected: string, ixs: Awaited<ReturnType<typeof revealDbc>>) {
  const before = await snapshot(c, [caller.publicKey]);
  await expectFail(ixs, [caller], expected);
  assert.deepEqual(await snapshot(c, [caller.publicKey]), before, `state moved after ${expected}`);
}

describe("sealed_call against a real Meteora DBC launch", function () {
  let treasury: PublicKey;
  let launchA: DbcLaunch; // the sealed launch
  let launchB: DbcLaunch; // a second launch for the negatives
  let planA: LaunchPlan;

  before(async function () {
    for (const k of [admin, caller, f1, f2, f3, ...racers]) await airdrop(k.publicKey, 200);
    await airdrop(launcher.publicKey, 1000);
    if (!(await accountExists(configPda()))) await send([await initConfigIx(program, admin.publicKey, CONFIG)], [admin]);
    const cfg = await fetchConfig(program);
    assert.isFalse(cfg.paused);
    assert.isAtMost(cfg.minCallerLockSecs.toNumber(), LOCK_SECS);
    treasury = cfg.treasury;
  });

  describe("sealed DBC launch: the seal commits to a pool that does not exist yet", () => {
    const stake = sol(0.5);
    const deposits = [sol(0.733333337), sol(1.177777771), sol(1.300000013)];
    const followers = [f1, f2, f3];
    let c: Call;
    let total: bigint;
    let tokensOut: bigint;
    let executedAt: number;
    const claims: bigint[] = [];

    it("the pool address is fixed by (config, base mint), the seal binds it, and nothing exists on chain", async () => {
      planA = planDbcLaunch();
      assert.isFalse(await accountExists(planA.pool), "pool must not exist before the launch");
      c = await openDbcCall({ mint: planA.baseMint.publicKey, pool: planA.pool, stake, maxVault: sol(8) });
      for (let i = 0; i < 3; i++) await deposit(followers[i], c, deposits[i]);
      total = stake + deposits.reduce((a, b) => a + b, 0n);
      const acc = await fetchCall(program, c.call);
      assert.strictEqual(callState(acc), "open");
      assert.strictEqual(acc.followerCount, 3);
      assert.strictEqual(big(acc.followerLamports), total - stake);
      assert.isFalse(await accountExists(planA.pool));
    });

    it("revealing before the launch exists is rejected (no mint, no pool), nothing moves", async () => {
      const ix = await revealAndSwapDbcIx(program, {
        caller: caller.publicKey,
        call: c.call,
        mint: c.mint,
        pool: c.pool,
        salt: c.salt,
        minimumAmountOut: 1n,
        poolInfo: {
          address: c.pool,
          config: planA.config.publicKey,
          baseMint: c.mint,
          baseVault: caller.publicKey,
          quoteVault: caller.publicKey,
          baseReserve: 0n,
          quoteReserve: 0n,
          sqrtPrice: 1n,
          isMigrated: false,
          migrationProgress: 0,
        },
        mintProgram: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      });
      await rejected(c, "AccountNotInitialized", withComputeBudget(400_000, [ix]));
    });

    it("the launch is created: a DBC config and pool on the committed addresses, decoded the same as the DBC SDK", async () => {
      launchA = await createDbcLaunch(launcher, planA, CURVE);
      assert.isTrue(launchA.pool.equals(c.pool));
      assert.isTrue(launchA.baseMint.equals(c.mint));
      await sleep(2000); // the pool activates by timestamp
      const mine = await readDbcPool(connection, launchA.pool);
      const theirs = (await new DynamicBondingCurveClient(connection, "confirmed").state.getPool(launchA.pool))!.poolState;
      assert.isTrue(mine.config.equals(theirs.config) && mine.config.equals(launchA.config));
      assert.isTrue(mine.baseMint.equals(theirs.baseMint));
      assert.isTrue(mine.baseVault.equals(theirs.baseVault) && mine.quoteVault.equals(theirs.quoteVault));
      assert.strictEqual(mine.sqrtPrice, BigInt(theirs.sqrtPrice.toString()));
      assert.strictEqual(mine.baseReserve, BigInt(theirs.baseReserve.toString()));
      assert.strictEqual(mine.quoteReserve, 0n);
      assert.isFalse(mine.isMigrated);
      const raw = await connection.getAccountInfo(launchA.pool);
      assert.strictEqual(decodeDbcPool(launchA.pool, raw!.data).sqrtPrice, mine.sqrtPrice);
    });

    it("caller reveals in ONE transaction: the whole vault buys from the curve at one price", async () => {
      const lamIn = await lamportsIn(c);
      const fee = total - lamIn;
      const callerFee = (fee * 3000n) / 10_000n;
      const treasuryFee = fee - callerFee;
      const reserve = BigInt(await connection.getMinimumBalanceForRentExemption(0));
      const before = await readDbcPool(connection, launchA.pool);
      const quotedOut = (await dbcQuote(launchA.pool, lamIn)).out;
      const tBefore = await lamports(treasury);
      const callerBefore = await lamports(caller.publicKey);

      const sent = await send(await revealDbc(c), [caller]);
      const cu = await computeUnits(sent.sig);
      console.log(`DBC reveal sig=${sent.sig} cu=${cu} size=${sent.size} lamportsIn=${lamIn} tokensOut=${quotedOut}`);
      assert.isBelow(cu, 400_000);
      assert.isAtMost(sent.size, 1232);

      const acc = await fetchCall(program, c.call);
      assert.strictEqual(callState(acc), "executed");
      tokensOut = big(acc.tokensOut);
      executedAt = acc.executedAt.toNumber();
      assert.isTrue(acc.revealedMint.equals(launchA.baseMint));
      assert.isTrue(acc.revealedPool.equals(launchA.pool));
      assert.strictEqual(big(acc.lamportsIn), lamIn);
      assert.strictEqual(tokensOut, quotedOut, "the single fill equals the DBC SDK quote for the whole vault in one swap");

      const vaultOut = getAssociatedTokenAddressSync(launchA.baseMint, c.vault, true);
      assert.strictEqual(await tokenBalance(vaultOut), tokensOut);
      assert.strictEqual((await lamports(treasury)) - tBefore, treasuryFee, "treasury fee");
      const outRent = await lamports(vaultOut);
      const callerDelta = (await lamports(caller.publicKey)) - callerBefore;
      const txFee = BigInt((await connection.getTransaction(sent.sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }))!.meta!.fee);
      assert.strictEqual(callerDelta, callerFee + reserve - outRent - txFee, "caller fee and reserve");
      assert.strictEqual(await lamports(c.vault), 0n, "vault SOL fully paid out");
      assert.isFalse(await accountExists(getAssociatedTokenAddressSync(NATIVE_MINT, c.vault, true)), "wSOL ATA closed");

      const after = await readDbcPool(connection, launchA.pool);
      assert.strictEqual(before.baseReserve - after.baseReserve, tokensOut, "curve paid out tokens_out");
      assert.strictEqual(after.quoteReserve - before.quoteReserve, (lamIn * 9900n) / 10_000n, "curve quote reserve gained the vault minus the 1% curve fee");
      assert.isTrue(after.sqrtPrice > before.sqrtPrice, "the buy moved the curve once");

      const spot = dbcSpotOut(lamIn, before.sqrtPrice);
      assert.isAtMost(Number(tokensOut), Number(spot), "fee and curve only make the fill worse than spot");
      assert.isAtLeast(Number(tokensOut), Number((spot * 7500n) / 10_000n));
    });

    it("followers claim floor(tokens_out * lamports / total); the caller claims after the lock", async () => {
      for (let i = 0; i < 3; i++) {
        const f = followers[i];
        await send([await claimIx(program, f.publicKey, c.call)], [f]);
        const got = await tokenBalance(getAssociatedTokenAddressSync(launchA.baseMint, f.publicKey));
        claims.push(got);
        assert.strictEqual(got, (tokensOut * deposits[i]) / total, `follower ${i} claim`);
      }
      await waitUntilChainTime(executedAt + LOCK_SECS + 1);
      await send([await callerClaimIx(program, caller.publicKey, c.call)], [caller]);
      const got = await tokenBalance(getAssociatedTokenAddressSync(launchA.baseMint, caller.publicKey));
      claims.push(got);
      assert.strictEqual(got, (tokensOut * stake) / total, "caller claim");
    });

    it("every wallet got the same price per lamport, within one base unit", async () => {
      const paid = [...deposits, stake];
      assert.strictEqual(claims.length, 4);
      for (let i = 0; i < 4; i++) {
        // 0 <= tokens_out * lamports - claim * total < total  <=>  the claim is floor(tokens_out * share)
        const rem = tokensOut * paid[i] - claims[i] * total;
        assert.isTrue(rem >= 0n && rem < total, `claimant ${i} off by more than one base unit`);
      }
      const sum = claims.reduce((a, b) => a + b, 0n);
      assert.isAtMost(Number(sum), Number(tokensOut));
      assert.isBelow(Number(tokensOut - sum), 5);
    });

    it("control: the same four buys racing a twin curve one by one pay four different prices", async () => {
      const ctl = await createDbcLaunch(launcher, planDbcLaunch(), CURVE);
      await sleep(2000);
      const paid = [stake, ...deposits];
      const raced: number[] = [];
      for (let i = 0; i < 4; i++) {
        const lamIn = paid[i] - (paid[i] * 100n) / 10_000n;
        const { out } = await dbcBuy(racers[i], ctl.pool, lamIn);
        raced.push(Number(lamIn) / Number(out));
      }
      for (let i = 1; i < 4; i++) assert.isAbove(raced[i], raced[i - 1], `racer ${i} paid more per token than racer ${i - 1}`);
      const sealed = [...deposits, stake].map((p, i) => Number(p) / Number(claims[i]));
      const sealedSpread = Math.max(...sealed) / Math.min(...sealed);
      const racedSpread = raced[3] / raced[0];
      console.log(`price spread: sealed ${sealedSpread.toFixed(9)}x, raced ${racedSpread.toFixed(4)}x`);
      assert.isBelow(sealedSpread, 1.000001);
      assert.isAbove(racedSpread, 1.02);
    });
  });

  describe("seal binding and hygiene on the DBC branch", () => {
    let dammMint: PublicKey;
    let dammPool: PublicKey;

    before(async () => {
      launchB = await createDbcLaunch(launcher, planDbcLaunch(), CURVE);
      await sleep(2000);
      ({ mint: dammMint } = await makeMeme(launcher, { below: false, supply: 1_000_000_000_000_000n }));
      dammPool = (await createPool(launcher, dammMint, sol(300), 250_000_000_000_000n)).address;
      await sleep(3000);
    });

    const fund = async (c: Call) => deposit(f1, c, sol(0.2));

    it("wrong salt: HashMismatch", async () => {
      const c = await openDbcCall({ mint: launchB.baseMint, pool: launchB.pool, stake: sol(0.1), maxVault: sol(2) });
      await fund(c);
      const wrong = { ...c, salt: randomSalt() };
      await rejected(wrong, "HashMismatch", await revealDbc(wrong));
    });

    it("a DAMM v2 seal (no kind byte) over the right DBC mint and pool does not open on the DBC branch", async () => {
      const c = await openDbcCall({
        mint: launchB.baseMint,
        pool: launchB.pool,
        stake: sol(0.1),
        maxVault: sol(2),
        hash: (call, salt) => commitment(call, launchB.baseMint, launchB.pool, salt),
      });
      await fund(c);
      await rejected(c, "HashMismatch", await revealDbc(c));
    });

    it("a DBC seal over a real DAMM v2 pool and mint does not open on the DAMM branch", async () => {
      const c = await openDbcCall({ mint: dammMint, pool: dammPool, stake: sol(0.1), maxVault: sol(2) });
      await fund(c);
      const ix = await revealAndSwapIx(program, { caller: caller.publicKey, call: c.call, mint: dammMint, pool: dammPool, salt: c.salt, minimumAmountOut: 1n });
      await rejected(c, "HashMismatch", withComputeBudget(400_000, [ix]));
    });

    it("a DAMM v2 pool passed to the DBC branch: NotDbcPool", async () => {
      const c = await openDbcCall({ mint: dammMint, pool: dammPool, stake: sol(0.1), maxVault: sol(2) });
      await fund(c);
      const ix = await revealAndSwapDbcIx(program, {
        caller: caller.publicKey,
        call: c.call,
        mint: dammMint,
        pool: dammPool,
        salt: c.salt,
        minimumAmountOut: 1n,
        poolInfo: { ...(await readDbcPool(connection, launchB.pool)), address: dammPool },
      });
      await rejected(c, "NotDbcPool", withComputeBudget(400_000, [ix]));
    });

    it("sealed mint is not the pool's base mint: PoolMintMismatch", async () => {
      const c = await openDbcCall({ mint: launchA.baseMint, pool: launchB.pool, stake: sol(0.1), maxVault: sol(2) });
      await fund(c);
      await rejected(c, "PoolMintMismatch", await revealDbc(c));
    });

    it("a config from another launch: DbcConfigMismatch", async () => {
      const c = await openDbcCall({ mint: launchB.baseMint, pool: launchB.pool, stake: sol(0.1), maxVault: sol(2) });
      await fund(c);
      await rejected(c, "DbcConfigMismatch", await revealDbc(c, { poolInfo: (i) => ({ ...i, config: launchA.config }) }));
    });

    it("another launch's vaults: PoolVaultMismatch", async () => {
      const c = await openDbcCall({ mint: launchB.baseMint, pool: launchB.pool, stake: sol(0.1), maxVault: sol(2) });
      await fund(c);
      const other = await readDbcPool(connection, launchA.pool);
      await rejected(c, "PoolVaultMismatch", await revealDbc(c, { poolInfo: (i) => ({ ...i, baseVault: other.baseVault }) }));
      await rejected(c, "PoolVaultMismatch", await revealDbc(c, { poolInfo: (i) => ({ ...i, quoteVault: other.quoteVault }) }));
    });

    it("the impact bound fixed at open is enforced on the curve: 50 bps cannot absorb a 1% curve fee", async () => {
      const c = await openDbcCall({ mint: launchB.baseMint, pool: launchB.pool, stake: sol(0.1), maxVault: sol(2), impact: 50 });
      await fund(c);
      await rejected(c, "PriceImpactExceeded", await revealDbc(c));
    });

    it("the caller's own minimum_amount_out is enforced by the curve: ExceededSlippage, nothing moves", async () => {
      const c = await openDbcCall({ mint: launchB.baseMint, pool: launchB.pool, stake: sol(0.1), maxVault: sol(2) });
      await fund(c);
      const before = await snapshot(c, [caller.publicKey]);
      const out = (await dbcQuote(c.pool, await lamportsIn(c))).out;
      const f = await failure(await revealDbc(c, { minOut: out + 1n }), [caller]);
      assert.match(f.text, /ExceededSlippage/);
      assert.deepEqual(await snapshot(c, [caller.publicKey]), before);
    });

    it("a curve that already completed: PoolMigrated", async () => {
      const tiny = await createDbcLaunch(launcher, planDbcLaunch(), { initialMarketCap: 1, migrationMarketCap: 3 });
      await sleep(2000);
      const client = new DynamicBondingCurveClient(connection, "confirmed");
      const cfg = (await client.state.getPoolConfig(tiny.config))!;
      const need = BigInt(cfg.migrationQuoteThreshold.toString());
      await dbcFillCurve(racers[0], tiny.pool, need * 2n);
      const done = await readDbcPool(connection, tiny.pool);
      assert.notStrictEqual(done.migrationProgress, 0, "curve completed");
      const c = await openDbcCall({ mint: tiny.baseMint, pool: tiny.pool, stake: sol(0.1), maxVault: sol(2) });
      await fund(c);
      await rejected(c, "PoolMigrated", await revealDbc(c, { minOut: 1n }));
    });
  });
});
