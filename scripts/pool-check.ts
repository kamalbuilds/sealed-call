// Cheap real devnet flow: is a DAMM v2 pool still accepted by reveal_and_swap for a NEW call?
// usage: npx tsx scripts/pool-check.ts [pool]
import { PublicKey } from "@solana/web3.js";
import { makeProgram, callPda, commitment, randomSalt, openCallIx, depositIx, revealAndSwapIx, claimIx, withComputeBudget, readPool, poolSides, spotOut, fetchCall, callState } from "../sdk/src/index";
import { connection, loadKeypair, send } from "../tests/helpers";
import { Wallet } from "@coral-xyz/anchor";

const pool = new PublicKey(process.argv[2] ?? "9mwSK2b1CL6knpy5A8SK2uv4UJfQ2P7FyKkbYiC19j8K");
const caller = loadKeypair("keys/devnet/caller.json");
const follower = loadKeypair("keys/devnet/follower3.json");
const program = makeProgram(connection, new Wallet(caller));

(async () => {
  const info = await readPool(connection, pool);
  const { wsolIsA, mint } = poolSides(info);
  const callId = BigInt(Date.now());
  const call = callPda(caller.publicKey, callId);
  const salt = randomSalt();
  const stake = 6_000_000n, dep = 5_000_000n;
  const open = await send([await openCallIx(program, { caller: caller.publicKey, callId, commitment: commitment(call, mint, pool, salt), revealWindowSecs: 3600, callerLockSecs: 86_400, maxVaultLamports: 40_000_000n, maxImpactBps: 2500, callerStakeLamports: stake })], [caller]);
  console.log("open", call.toBase58(), open.sig);
  const d = await send([await depositIx(program, follower.publicKey, call, dep)], [follower]);
  console.log("deposit", d.sig);
  const total = stake + dep;
  const live = await readPool(connection, pool);
  const minOut = (spotOut(total - total / 100n, live.sqrtPrice, wsolIsA) * 75n) / 100n;
  const r = await send(withComputeBudget(400_000, [await revealAndSwapIx(program, { caller: caller.publicKey, call, mint, pool, salt, minimumAmountOut: minOut })]), [caller]);
  const c = await fetchCall(program, call);
  console.log("reveal", r.sig, callState(c), "tokensOut", c.tokensOut.toString());
  const cl = await send([await claimIx(program, follower.publicKey, call)], [follower]);
  console.log("claim", cl.sig);
})().catch((e) => { console.error("FAIL", e?.logs ?? "", e?.message ?? e); process.exit(1); });
