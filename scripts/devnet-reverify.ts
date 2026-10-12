// Post-upgrade devnet re-verify: a stranger griefs the vault's wSOL ATA, then open, deposit, reveal (one price), claim,
// and caller_claim on any executed call whose lock has passed. usage: npx tsx scripts/devnet-reverify.ts [pool]
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { createAssociatedTokenAccountIdempotentInstruction, createSyncNativeInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Wallet } from "@coral-xyz/anchor";
import { makeProgram, callPda, vaultPda, commitment, randomSalt, openCallIx, depositIx, revealAndSwapIx, claimIx, callerClaimIx, withComputeBudget, readPool, poolSides, spotOut, fetchCall, callState, NATIVE_MINT } from "../sdk/src/index";
import { connection, loadKeypair, send, chainTime } from "../tests/helpers";

const pool = new PublicKey(process.argv[2] ?? "9mwSK2b1CL6knpy5A8SK2uv4UJfQ2P7FyKkbYiC19j8K");
const caller = loadKeypair("keys/devnet/caller.json");
const follower = loadKeypair("keys/devnet/follower3.json");
const griefer = loadKeypair("keys/devnet/follower2.json");
const program = makeProgram(connection, new Wallet(caller));

(async () => {
  const now = await chainTime();
  const all = await program.account.call.all([{ memcmp: { offset: 8, bytes: caller.publicKey.toBase58() } }]);
  for (const { publicKey, account } of all) {
    if (callState(account) !== "executed" || account.callerClaimed) continue;
    if (account.executedAt.toNumber() + account.callerLockSecs.toNumber() > now) continue;
    const s = await send([await callerClaimIx(program, caller.publicKey, publicKey)], [caller]);
    console.log("caller_claim", publicKey.toBase58(), s.sig);
    break;
  }

  const info = await readPool(connection, pool);
  const { wsolIsA, mint } = poolSides(info);
  const callId = BigInt(Date.now());
  const call = callPda(caller.publicKey, callId);
  const vault = vaultPda(call);
  const salt = randomSalt();
  const stake = 6_000_000n, dep = 5_000_000n;
  const open = await send([await openCallIx(program, { caller: caller.publicKey, callId, commitment: commitment(call, mint, pool, salt), revealWindowSecs: 3600, callerLockSecs: 86_400, maxVaultLamports: 40_000_000n, maxImpactBps: 2500, callerStakeLamports: stake })], [caller]);
  console.log("open", call.toBase58(), open.sig);
  const d = await send([await depositIx(program, follower.publicKey, call, dep)], [follower]);
  console.log("deposit", d.sig);
  const vaultWsol = getAssociatedTokenAddressSync(NATIVE_MINT, vault, true);
  const g = await send([
    createAssociatedTokenAccountIdempotentInstruction(griefer.publicKey, vaultWsol, vault, NATIVE_MINT),
    SystemProgram.transfer({ fromPubkey: griefer.publicKey, toPubkey: vaultWsol, lamports: 1 }),
    createSyncNativeInstruction(vaultWsol),
  ], [griefer]);
  console.log("grief (1 lamport wSOL into vault wSOL ATA)", g.sig);
  const total = stake + dep;
  const live = await readPool(connection, pool);
  const minOut = (spotOut(total - total / 100n, live.sqrtPrice, wsolIsA) * 75n) / 100n;
  const r = await send(withComputeBudget(400_000, [await revealAndSwapIx(program, { caller: caller.publicKey, call, mint, pool, salt, minimumAmountOut: minOut })]), [caller]);
  const c = await fetchCall(program, call);
  console.log("reveal", r.sig, callState(c), "lamportsIn", c.lamportsIn.toString(), "tokensOut", c.tokensOut.toString());
  const cl = await send([await claimIx(program, follower.publicKey, call)], [follower]);
  console.log("claim", cl.sig, "expected", ((BigInt(c.tokensOut.toString()) * dep) / total).toString());
  console.log("caller unlock at", new Date((c.executedAt.toNumber() + 86_400) * 1000).toISOString());
})().catch((e) => { console.error("FAIL", e?.logs ?? "", e?.message ?? e); process.exit(1); });
