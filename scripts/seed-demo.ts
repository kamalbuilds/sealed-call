// Seed the ledger with three distinct demo callers on devnet: one sealed (taking deposits), one revealed, one lapsed.
// usage: npx tsx scripts/seed-demo.ts   (keys in keys/demo/, gitignored)
import { PublicKey } from "@solana/web3.js";
import { makeProgram, callPda, commitment, randomSalt, openCallIx, depositIx, revealAndSwapIx, withComputeBudget, readPool, poolSides, spotOut } from "../sdk/src/index";
import { connection, loadKeypair, send } from "../tests/helpers";
import { Wallet } from "@coral-xyz/anchor";
const pool = new PublicKey("9mwSK2b1CL6knpy5A8SK2uv4UJfQ2P7FyKkbYiC19j8K");
const follower = loadKeypair("keys/demo/follower.json");
async function open(kpPath: string, windows: number[]) {
  const caller = loadKeypair(kpPath); const program = makeProgram(connection, new Wallet(caller));
  const { mint } = poolSides(await readPool(connection, pool));
  for (const w of windows) {
    const callId = BigInt(Date.now()); const call = callPda(caller.publicKey, callId); const salt = randomSalt();
    try {
      await send([await openCallIx(program, { caller: caller.publicKey, callId, commitment: commitment(call, mint, pool, salt), revealWindowSecs: w, callerLockSecs: 86_400, maxVaultLamports: 40_000_000n, maxImpactBps: 2500, callerStakeLamports: 6_000_000n })], [caller]);
      console.log(kpPath, "open", call.toBase58(), "window", w, "salt", Buffer.from(salt).toString("hex")); return { caller, program, call, mint, salt };
    } catch (e: any) { console.log("window", w, "rejected", e?.message?.slice(0, 80)); }
  }
  throw new Error("no window accepted");
}
(async () => {
  const which = process.argv[2] ?? "all";
  if (which === "all") await open("keys/demo/caller-a.json", [259_200, 172_800, 86_400]);
  const b = await open(which === "all" ? "keys/demo/caller-b.json" : "keys/demo/caller-c.json", [3600]);
  console.log("deposit", (await send([await depositIx(b.program, follower.publicKey, b.call, 5_000_000n)], [follower])).sig);
  const { wsolIsA } = poolSides(await readPool(connection, pool)); const live = await readPool(connection, pool);
  const total = 11_000_000n; const minOut = (spotOut(total - total / 100n, live.sqrtPrice, wsolIsA) * 75n) / 100n;
  console.log("reveal", (await send(withComputeBudget(400_000, [await revealAndSwapIx(b.program, { caller: b.caller.publicKey, call: b.call, mint: b.mint, pool, salt: b.salt, minimumAmountOut: minOut })]), [b.caller])).sig);
})().catch((e) => { console.error("FAIL", e?.logs ?? "", e?.message ?? e); process.exit(1); });
