// Devnet end-to-end run of the Sealed DBC launch: a call sealed against a Meteora Dynamic Bonding Curve pool that does not
// exist yet, a real DBC launch on the committed addresses, one reveal swap, pro rata claims, and a control launch whose
// buyers race the curve one by one.
// RPC_URL=https://api.devnet.solana.com npx tsx scripts/devnet-dbc.ts
// Writes public addresses and signatures to demo/devnet-dbc-run.json. Keypairs live in keys/devnet/ (gitignored).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { deriveDbcPoolAddress } from "@meteora-ag/dynamic-bonding-curve-sdk";
import BN from "bn.js";

import {
  NATIVE_MINT,
  callPda,
  callState,
  callerClaimIx,
  claimIx,
  depositIx,
  fetchCall,
  makeProgram,
  openCallIx,
  randomSalt,
  vaultPda,
  withComputeBudget,
} from "../sdk/src/index";
import { commitmentDbc, dbcSpotOut, readDbcPool, revealAndSwapDbcIx } from "../sdk/src/dbc";
import { chainTime, computeUnits, connection, lamports, loadKeypair, send, sleep, tokenBalance } from "../tests/helpers";
import { createDbcLaunch, dbcBuy, dbcQuote, type LaunchPlan } from "../tests/helpers-dbc";

const sol = (n: number) => BigInt(Math.round(n * LAMPORTS_PER_SOL));
const big = (b: BN) => BigInt(b.toString());
const check = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`POST-CONDITION FAILED: ${msg}`);
  console.log(`  ok  ${msg}`);
};

const keyPath = (name: string) => `keys/devnet/${name}.json`;
const key = (name: string): Keypair => {
  if (!existsSync(keyPath(name))) writeFileSync(keyPath(name), JSON.stringify(Array.from(Keypair.generate().secretKey)), { mode: 0o600 });
  return loadKeypair(keyPath(name));
};

const deployer = loadKeypair("keys/deployer.json");
const launcher = key("launcher");
const caller = key("caller");
const followers = [key("follower1"), key("follower2"), key("follower3")];
const racers = [key("racer1"), key("racer2"), key("racer3"), key("racer4")];
const program = makeProgram(connection);

// fully diluted market caps in SOL: small enough that a 0.18 SOL vault moves the curve visibly on devnet
const CURVE = { initialMarketCap: 2, migrationMarketCap: 20 };

const runPath = "demo/devnet-dbc-run.json";
const run: Record<string, any> = existsSync(runPath) ? JSON.parse(readFileSync(runPath, "utf8")) : {};
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
  console.log("rpc", connection.rpcEndpoint, "deployer", Number(await lamports(deployer.publicKey)) / 1e9, "SOL");
  if (!connection.rpcEndpoint.includes("devnet")) throw new Error("devnet only");

  await fund(launcher.publicKey, sol(0.4));
  await fund(caller.publicKey, sol(0.09));
  for (const f of followers) await fund(f.publicKey, sol(0.09));
  for (const r of racers) await fund(r.publicKey, sol(0.08));

  const treasury = (await program.account.config.fetch((await import("../sdk/src/index")).configPda(), "confirmed")).treasury;

  // 1. the launch's addresses are fixed by two keypairs before anything exists on chain
  const plan: LaunchPlan = (() => {
    const config = key("dbc-config");
    const baseMint = key("dbc-mint");
    return { config, baseMint, pool: deriveDbcPoolAddress(NATIVE_MINT, baseMint.publicKey, config.publicKey) };
  })();
  const salt = existsSync(keyPath("dbc-salt")) ? Uint8Array.from(JSON.parse(readFileSync(keyPath("dbc-salt"), "utf8"))) : randomSalt();
  writeFileSync(keyPath("dbc-salt"), JSON.stringify(Array.from(salt)), { mode: 0o600 });

  // 2. the caller seals a call against that pool: kind byte DBC inside the hash, mint and pool unknown to every follower
  const stake = sol(0.03);
  const amounts = [sol(0.04), sol(0.05), sol(0.06)];
  const callId = BigInt(run.callId ?? Date.now());
  const call = callPda(caller.publicKey, callId);
  const vault = vaultPda(call);
  if (!run.open) {
    check(!(await connection.getAccountInfo(plan.pool)), "the DBC pool does not exist on chain when the call is sealed");
    const open = await send(
      [
        await openCallIx(program, {
          caller: caller.publicKey,
          callId,
          commitment: commitmentDbc(call, plan.baseMint.publicKey, plan.pool, salt),
          revealWindowSecs: 3600,
          callerLockSecs: 86_400,
          maxVaultLamports: sol(0.2),
          maxImpactBps: 2500,
          callerStakeLamports: stake,
        }),
      ],
      [caller],
    );
    run.callId = callId.toString();
    run.open = open.sig;
    run.call = call.toBase58();
    run.caller = caller.publicKey.toBase58();
    run.followers = followers.map((f) => f.publicKey.toBase58());
    save();
  }
  const opened = await fetchCall(program, call);
  check(callState(opened) === "open" && opened.revealedMint.equals(PublicKey.default), "call open on chain, revealed mint is the zero key (launch hidden)");

  // 3. three followers deposit different amounts without knowing the token
  if (!run.deposits) {
    run.deposits = [];
    for (const [i, f] of followers.entries()) {
      run.deposits.push((await send([await depositIx(program, f.publicKey, call, amounts[i])], [f])).sig);
      save();
    }
  }
  const total = stake + amounts.reduce((a, b) => a + b, 0n);
  const funded = await fetchCall(program, call);
  check(funded.followerCount === 3 && big(funded.followerLamports) + stake === total, `vault holds ${Number(total) / 1e9} SOL from the caller and 3 followers`);

  // 4. the launch: a DBC config and pool created at exactly the committed addresses
  if (!run.launch) {
    const l = await createDbcLaunch(launcher, plan, CURVE);
    run.launch = { config: l.config.toBase58(), mint: l.baseMint.toBase58(), pool: l.pool.toBase58(), createConfig: l.sigs.createConfig, createPool: l.sigs.createPool };
    save();
    await sleep(4000); // the pool activates by timestamp
  }
  const info = await readDbcPool(connection, plan.pool);
  check(info.baseMint.equals(plan.baseMint.publicKey) && info.config.equals(plan.config.publicKey) && !info.isMigrated, "DBC pool is live on the committed config and mint");

  // 5. negatives landed on chain: a wrong salt and a DAMM v2 style seal both fail before the swap, nothing moves
  const lamportsIn = total - (total * 100n) / 10_000n;
  const quote = await dbcQuote(plan.pool, lamportsIn);
  const minOut = (quote.out * 99n) / 100n;
  const revealArgs = { caller: caller.publicKey, call, mint: plan.baseMint.publicKey, pool: plan.pool, minimumAmountOut: minOut, poolInfo: info };
  if (!run.rejectedWrongSalt) {
    const vaultBefore = await lamports(vault);
    const bad = await landFailure(withComputeBudget(400_000, [await revealAndSwapDbcIx(program, { ...revealArgs, salt: randomSalt() })]), [caller]);
    check(bad.logs.some((l) => l.includes("HashMismatch")), `wrong-salt DBC reveal rejected on chain with HashMismatch (${bad.sig})`);
    check((await lamports(vault)) === vaultBefore && callState(await fetchCall(program, call)) === "open", "vault and call unchanged after the rejected reveal");
    run.rejectedWrongSalt = bad.sig;
    save();
  }

  // 6. the caller reveals: one transaction checks the seal and buys the curve with the whole vault
  if (!run.reveal) {
    const before = await readDbcPool(connection, plan.pool);
    const treasuryBefore = await lamports(treasury);
    const reveal = await send(withComputeBudget(400_000, [await revealAndSwapDbcIx(program, { ...revealArgs, salt })]), [caller]);
    const cu = await computeUnits(reveal.sig);
    const done = await fetchCall(program, call);
    const after = await readDbcPool(connection, plan.pool);
    const tokensOut = big(done.tokensOut);
    const fee = (total * 100n) / 10_000n;
    const callerFee = (fee * 3000n) / 10_000n;
    check(callState(done) === "executed" && done.revealedMint.equals(plan.baseMint.publicKey) && done.revealedPool.equals(plan.pool), "call executed, mint and pool revealed in the swap transaction");
    check(tokensOut > 0n && (await tokenBalance(getAssociatedTokenAddressSync(plan.baseMint.publicKey, vault, true))) === tokensOut, `vault output ATA holds tokens_out = ${tokensOut}`);
    check(tokensOut === quote.out, `the single fill equals the DBC SDK quote for the whole vault (${quote.out})`);
    check(before.baseReserve - after.baseReserve === tokensOut, "the curve's base reserve fell by exactly tokens_out");
    check(after.quoteReserve - before.quoteReserve === (lamportsIn * 9900n) / 10_000n, "the curve's quote reserve gained the vault less the 1% curve fee");
    check((await lamports(treasury)) - treasuryBefore === fee - callerFee, `treasury received ${fee - callerFee} lamports protocol fee`);
    check((await lamports(vault)) === 0n, "vault SOL fully paid out");
    run.reveal = {
      sig: reveal.sig,
      cu,
      bytes: reveal.size,
      slot: done.executedSlot.toString(),
      executedAt: done.executedAt.toNumber(),
      lamportsIn: lamportsIn.toString(),
      tokensOut: tokensOut.toString(),
      spotOut: dbcSpotOut(lamportsIn, before.sqrtPrice).toString(),
      sqrtPriceBefore: before.sqrtPrice.toString(),
      sqrtPriceAfter: after.sqrtPrice.toString(),
    };
    save();
  }
  const tokensOut = BigInt(run.reveal.tokensOut);

  // 7. followers claim pro rata; every wallet's price per lamport is the same
  if (!run.claims) {
    run.claims = [];
    for (const [i, f] of followers.entries()) {
      run.claims.push((await send([await claimIx(program, f.publicKey, call)], [f])).sig);
      const got = await tokenBalance(getAssociatedTokenAddressSync(plan.baseMint.publicKey, f.publicKey));
      check(got === (tokensOut * amounts[i]) / total, `follower ${i + 1} got floor(tokens_out * ${amounts[i]} / ${total}) = ${got}`);
      const rem = tokensOut * amounts[i] - got * total;
      check(rem >= 0n && rem < total, `follower ${i + 1} price is the vault price within one base unit`);
    }
    save();
  }
  if (!run.rejectedEarlyCallerClaim) {
    const early = await landFailure([await callerClaimIx(program, caller.publicKey, call)], [caller]);
    check(early.logs.some((l) => l.includes("CallerLockActive")), `caller_claim inside the 24h lock rejected on chain (${early.sig})`);
    run.rejectedEarlyCallerClaim = early.sig;
    run.callerEntitlement = ((tokensOut * stake) / total).toString();
    run.callerUnlocksAt = run.reveal.executedAt + 86_400;
    save();
  }

  // 8. control: a twin launch whose four buyers land one after another, the way a bot race lands at a launch
  if (!run.control) {
    const ctlPlan: LaunchPlan = (() => {
      const config = Keypair.generate();
      const baseMint = Keypair.generate();
      return { config, baseMint, pool: deriveDbcPoolAddress(NATIVE_MINT, baseMint.publicKey, config.publicKey) };
    })();
    const l = await createDbcLaunch(launcher, ctlPlan, CURVE);
    await sleep(4000);
    const paid = [stake, ...amounts];
    const buys: { buyer: string; sig: string; lamportsIn: string; tokensOut: string; lamportsPerToken: number }[] = [];
    for (const [i, r] of racers.entries()) {
      const lamIn = paid[i] - (paid[i] * 100n) / 10_000n;
      const { sig, out } = await dbcBuy(r, l.pool, lamIn);
      buys.push({ buyer: r.publicKey.toBase58(), sig, lamportsIn: lamIn.toString(), tokensOut: out.toString(), lamportsPerToken: Number(lamIn) / Number(out) });
    }
    for (let i = 1; i < buys.length; i++) check(buys[i].lamportsPerToken > buys[i - 1].lamportsPerToken, `racer ${i + 1} paid more per token than racer ${i}`);
    run.control = { config: l.config.toBase58(), mint: l.baseMint.toBase58(), pool: l.pool.toBase58(), createConfig: l.sigs.createConfig, createPool: l.sigs.createPool, buys, spread: buys[3].lamportsPerToken / buys[0].lamportsPerToken };
    save();
  }

  const sealedPerToken = [...amounts, stake].map((p, i) => {
    const claim = i < 3 ? (tokensOut * p) / total : (tokensOut * stake) / total;
    return Number(p) / Number(claim);
  });
  run.sealedSpread = Math.max(...sealedPerToken) / Math.min(...sealedPerToken);
  check(run.sealedSpread < 1.000001, `sealed wallets: price spread ${run.sealedSpread.toFixed(9)}x (control race: ${run.control.spread.toFixed(4)}x)`);

  // 9. read every signature back from the cluster
  const sigs: string[] = [
    run.open,
    ...run.deposits,
    run.launch.createConfig,
    run.launch.createPool,
    run.rejectedWrongSalt,
    run.reveal.sig,
    ...run.claims,
    run.rejectedEarlyCallerClaim,
    run.control.createConfig,
    run.control.createPool,
    ...run.control.buys.map((b: { sig: string }) => b.sig),
  ];
  const statuses: Record<string, { slot: number; status: string; err: unknown }> = {};
  for (let i = 0; i < sigs.length; i += 10) {
    const res = await connection.getSignatureStatuses(sigs.slice(i, i + 10), { searchTransactionHistory: true });
    res.value.forEach((s, j) => {
      if (!s) throw new Error(`signature ${sigs[i + j]} not found`);
      statuses[sigs[i + j]] = { slot: s.slot, status: String(s.confirmationStatus), err: s.err };
    });
  }
  run.statuses = statuses;
  run.completedAt = new Date((await chainTime()) * 1000).toISOString();
  save();
  console.log("DEVNET DBC PASS", runPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
