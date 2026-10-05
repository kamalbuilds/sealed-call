// Devnet end-to-end run of sealed_call against a real Meteora DAMM v2 pool.
// RPC_URL=https://api.devnet.solana.com npx tsx scripts/devnet-e2e.ts
// Writes public addresses and signatures to demo/devnet-run.json. Keypairs live in keys/devnet/ (gitignored).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";

import {
  callPda,
  callState,
  callerClaimIx,
  claimIx,
  commitment,
  configPda,
  depositIx,
  expireIx,
  fetchCall,
  initConfigIx,
  makeProgram,
  openCallIx,
  poolSides,
  randomSalt,
  readPool,
  revealAndSwapIx,
  spotOut,
  vaultPda,
  withComputeBudget,
  withdrawIx,
  type ConfigParams,
} from "../sdk/src/index";
import { accountExists, chainTime, computeUnits, connection, createPool, failure, lamports, loadKeypair, makeMeme, send, sleep, tokenBalance, waitUntilChainTime } from "../tests/helpers";

const sol = (n: number) => BigInt(Math.round(n * LAMPORTS_PER_SOL));
const big = (b: BN) => BigInt(b.toString());
const check = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`POST-CONDITION FAILED: ${msg}`);
  console.log(`  ok  ${msg}`);
};

mkdirSync("keys/devnet", { recursive: true });
const key = (name: string): Keypair => {
  const path = `keys/devnet/${name}.json`;
  if (!existsSync(path)) writeFileSync(path, JSON.stringify(Array.from(Keypair.generate().secretKey)), { mode: 0o600 });
  return loadKeypair(path);
};

const deployer = loadKeypair("keys/deployer.json");
const treasury = key("treasury");
const caller = key("caller");
const followers = [key("follower1"), key("follower2"), key("follower3")];
const program = makeProgram(connection);

const CONFIG: ConfigParams = {
  treasury: treasury.publicKey,
  feeBps: 100,
  callerFeeShareBps: 3000,
  maxCallLamports: new BN(sol(50).toString()),
  maxDepositLamports: new BN(sol(20).toString()),
  minCallerStakeBps: 500,
  minCallerLockSecs: new BN(86_400),
  maxRevealWindowSecs: new BN(259_200),
  maxPriceImpactBps: 2500,
  minLockedLiquidityBps: 8000,
  maxSwapReserveBps: 1000,
  minDepositLamports: new BN(5_000_000),
};

const runPath = "demo/devnet-run.json";
const run: Record<string, unknown> = existsSync(runPath) ? JSON.parse(readFileSync(runPath, "utf8")) : {};
const save = () => writeFileSync(runPath, JSON.stringify(run, null, 2) + "\n");

async function fund(to: PublicKey, want: bigint) {
  const have = await lamports(to);
  if (have >= want) return;
  await send([SystemProgram.transfer({ fromPubkey: deployer.publicKey, toPubkey: to, lamports: want - have })], [deployer]);
}

/** Lands a transaction that the program rejects (no preflight), so the failure is on chain and visible in an explorer. */
async function landFailure(ixs: TransactionInstruction[], signers: Keypair[]): Promise<{ sig: string; logs: string[] }> {
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: signers[0].publicKey, recentBlockhash: blockhash }).add(...ixs);
  tx.sign(...signers);
  const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
  for (let i = 0; i < 120; i++) {
    const t = await connection.getTransaction(sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    if (t) {
      if (!t.meta?.err) throw new Error(`expected ${sig} to fail, it succeeded`);
      return { sig, logs: t.meta.logMessages ?? [] };
    }
    await sleep(500);
  }
  throw new Error(`failed tx ${sig} never landed`);
}

async function main() {
  console.log("rpc", connection.rpcEndpoint, "deployer", deployer.publicKey.toBase58(), Number(await lamports(deployer.publicKey)) / 1e9, "SOL");

  // 1. config, treasury pre-funded above rent so small fee transfers never revert
  await fund(treasury.publicKey, sol(0.002));
  if (!(await accountExists(configPda()))) {
    const { sig } = await send([await initConfigIx(program, deployer.publicKey, CONFIG)], [deployer]);
    run.initConfig = sig;
    save();
  }
  const cfg = await program.account.config.fetch(configPda(), "confirmed");
  check(cfg.treasury.equals(treasury.publicKey) && cfg.minCallerLockSecs.toNumber() === 86_400, "config on chain: treasury set, caller lock floor 24h");

  // 2. market: fixed-supply mint (no mint or freeze authority), DAMM v2 pool with its liquidity permanently locked
  let mint: PublicKey, pool: PublicKey;
  if (run.mint && run.pool) {
    mint = new PublicKey(run.mint as string);
    pool = new PublicKey(run.pool as string);
  } else {
    await fund(caller.publicKey, sol(0.5));
    ({ mint } = await makeMeme(caller, { below: false, supply: 1_000_000_000_000_000n }));
    const info = await createPool(caller, mint, sol(0.4), 400_000_000_000_000n);
    pool = info.address;
    run.mint = mint.toBase58();
    run.pool = pool.toBase58();
    save();
    await sleep(3000); // the pool must be activated before the call opens
  }
  const poolInfo = await readPool(connection, pool);
  const { wsolIsA, mint: poolMint } = poolSides(poolInfo);
  check(poolMint.equals(mint), "pool pairs wSOL with the called mint");

  // 3. caller opens a sealed call: the mint and pool are only a hash on chain
  await fund(caller.publicKey, sol(0.04));
  for (const f of followers) await fund(f.publicKey, sol(0.02));
  const callId = BigInt(Date.now());
  const call = callPda(caller.publicKey, callId);
  const vault = vaultPda(call);
  const salt = randomSalt();
  const stake = sol(0.006);
  const open = await send(
    [
      await openCallIx(program, {
        caller: caller.publicKey,
        callId,
        commitment: commitment(call, mint, pool, salt),
        revealWindowSecs: 3600,
        callerLockSecs: 86_400,
        maxVaultLamports: sol(0.04),
        maxImpactBps: 2500,
        callerStakeLamports: stake,
      }),
    ],
    [caller],
  );
  const opened = await fetchCall(program, call);
  check(callState(opened) === "open" && opened.revealedMint.equals(PublicKey.default), "call open, revealed mint is the zero key (token hidden)");

  // 4. three followers deposit different amounts without knowing the token
  const amounts = [sol(0.01), sol(0.008), sol(0.006)];
  const deposits: string[] = [];
  for (const [i, f] of followers.entries()) deposits.push((await send([await depositIx(program, f.publicKey, call, amounts[i])], [f])).sig);
  const funded = await fetchCall(program, call);
  const total = stake + amounts.reduce((a, b) => a + b, 0n);
  check(funded.followerCount === 3 && big(funded.followerLamports) + stake === total, `vault holds ${Number(total) / 1e9} SOL from caller + 3 followers`);

  // 5. negative: a reveal with the wrong salt lands on chain and is rejected; nothing moves
  const lamportsIn = total - (total * 100n) / 10_000n;
  const live = await readPool(connection, pool);
  const minOut = (spotOut(lamportsIn, live.sqrtPrice, wsolIsA) * 75n) / 100n;
  const revealArgs = { caller: caller.publicKey, call, mint, pool, minimumAmountOut: minOut };
  const vaultBefore = await lamports(vault);
  const bad = await landFailure(withComputeBudget(400_000, [await revealAndSwapIx(program, { ...revealArgs, salt: randomSalt() })]), [caller]);
  check(bad.logs.some((l) => l.includes("HashMismatch")), `wrong-salt reveal rejected on chain with HashMismatch (${bad.sig})`);
  check((await lamports(vault)) === vaultBefore && callState(await fetchCall(program, call)) === "open", "vault and call unchanged after the rejected reveal");

  // 6. the caller reveals: one transaction checks the hash and swaps the whole vault through DAMM v2
  const callerSolBefore = await lamports(caller.publicKey);
  const treasuryBefore = await lamports(treasury.publicKey);
  const reveal = await send(withComputeBudget(400_000, [await revealAndSwapIx(program, { ...revealArgs, salt })]), [caller]);
  const cu = await computeUnits(reveal.sig);
  const done = await fetchCall(program, call);
  const tokensOut = big(done.tokensOut);
  const vaultOut = getAssociatedTokenAddressSync(mint, vault, true, TOKEN_PROGRAM_ID);
  check(callState(done) === "executed" && done.revealedMint.equals(mint) && done.revealedPool.equals(pool), "call executed, mint and pool revealed in the swap transaction");
  check(tokensOut > 0n && (await tokenBalance(vaultOut)) === tokensOut, `vault output ATA holds tokens_out = ${tokensOut}`);
  const fee = (total * 100n) / 10_000n;
  const callerFee = (fee * 3000n) / 10_000n;
  check((await lamports(treasury.publicKey)) - treasuryBefore === fee - callerFee, `treasury received ${fee - callerFee} lamports protocol fee`);
  console.log(`  reveal cu=${cu} size=${reveal.size} caller_fee=${callerFee} caller_sol_delta=${(await lamports(caller.publicKey)) - callerSolBefore}`);

  // 7. followers claim pro rata; the caller's share stays locked for 24h
  const claims: string[] = [];
  for (const [i, f] of followers.entries()) {
    claims.push((await send([await claimIx(program, f.publicKey, call)], [f])).sig);
    const got = await tokenBalance(getAssociatedTokenAddressSync(mint, f.publicKey, false, TOKEN_PROGRAM_ID));
    check(got === (tokensOut * amounts[i]) / total, `follower ${i + 1} got floor(tokens_out * ${amounts[i]} / ${total}) = ${got}`);
  }
  const early = await landFailure([await callerClaimIx(program, caller.publicKey, call)], [caller]);
  check(early.logs.some((l) => l.includes("CallerLockActive")), `caller_claim inside the 24h lock rejected on chain (${early.sig})`);

  run.happy = {
    call: call.toBase58(),
    callId: callId.toString(),
    caller: caller.publicKey.toBase58(),
    followers: followers.map((f) => f.publicKey.toBase58()),
    open: open.sig,
    deposits,
    rejectedReveal: bad.sig,
    reveal: reveal.sig,
    revealCu: cu,
    revealBytes: reveal.size,
    executedSlot: done.executedSlot.toString(),
    tokensOut: tokensOut.toString(),
    claims,
    rejectedEarlyCallerClaim: early.sig,
    callerUnlocksAt: done.executedAt.toNumber() + 86_400,
  };
  save();

  // 8. refund path: a second call the caller never reveals; followers withdraw in full, expire returns the stake
  const id2 = callId + 1n;
  const call2 = callPda(caller.publicKey, id2);
  const salt2 = randomSalt();
  const open2 = await send(
    [
      await openCallIx(program, {
        caller: caller.publicKey,
        callId: id2,
        commitment: commitment(call2, mint, pool, salt2),
        revealWindowSecs: 60,
        callerLockSecs: 86_400,
        maxVaultLamports: sol(0.04),
        maxImpactBps: 2500,
        callerStakeLamports: stake,
      }),
    ],
    [caller],
  );
  const withdraws: string[] = [];
  for (const f of followers.slice(0, 2)) {
    await send([await depositIx(program, f.publicKey, call2, sol(0.005))], [f]);
    const before = await lamports(f.publicKey);
    const w = await send([await withdrawIx(program, f.publicKey, call2)], [f]);
    const t = await connection.getTransaction(w.sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    const after = await lamports(f.publicKey);
    // deposit amount + the position's rent come back, minus only the withdraw fee
    check(after + BigInt(t!.meta!.fee) - before >= sol(0.005), `follower withdrew the full 0.005 SOL (${w.sig})`);
    withdraws.push(w.sig);
  }
  const deadline = (await fetchCall(program, call2)).revealDeadline.toNumber();
  await waitUntilChainTime(deadline + 2);
  const lateReveal = await landFailure(withComputeBudget(400_000, [await revealAndSwapIx(program, { caller: caller.publicKey, call: call2, mint, pool, salt: salt2, minimumAmountOut: 1n })]), [caller]);
  check(lateReveal.logs.some((l) => l.includes("DeadlinePassed")), `reveal after the deadline rejected on chain (${lateReveal.sig})`);
  const exp = await send([await expireIx(program, call2)], [caller]);
  check(callState(await fetchCall(program, call2)) === "expired" && (await lamports(vaultPda(call2))) === 0n, "expired call: vault empty, stake and reserve returned to the caller");

  run.refund = { call: call2.toBase58(), open: open2.sig, withdraws, rejectedLateReveal: lateReveal.sig, expire: exp.sig };
  run.completedAt = new Date((await chainTime()) * 1000).toISOString();
  save();
  console.log("DEVNET E2E PASS", runPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
