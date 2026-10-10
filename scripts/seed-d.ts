// Caller D: a different call shape (0.007 SOL stake, 0.06 SOL cap, 36 h window, 15% max impact). Salt saved to keys/demo/caller-d.salt.json.
import { writeFileSync } from "node:fs";
import { PublicKey } from "@solana/web3.js";
import { makeProgram, callPda, commitment, randomSalt, openCallIx, readPool, poolSides } from "../sdk/src/index";
import { connection, loadKeypair, send } from "../tests/helpers";
import { Wallet } from "@coral-xyz/anchor";
const pool = new PublicKey("9mwSK2b1CL6knpy5A8SK2uv4UJfQ2P7FyKkbYiC19j8K");
(async () => {
  const caller = loadKeypair("keys/demo/caller-d.json"); const program = makeProgram(connection, new Wallet(caller));
  const { mint } = poolSides(await readPool(connection, pool));
  const callId = BigInt(Date.now()); const call = callPda(caller.publicKey, callId); const salt = randomSalt();
  writeFileSync("keys/demo/caller-d.salt.json", JSON.stringify({ call: call.toBase58(), callId: callId.toString(), mint: mint.toBase58(), pool: pool.toBase58(), salt: Buffer.from(salt).toString("hex") }, null, 1));
  const r = await send([await openCallIx(program, { caller: caller.publicKey, callId, commitment: commitment(call, mint, pool, salt), revealWindowSecs: 129_600, callerLockSecs: 172_800, maxVaultLamports: 60_000_000n, maxImpactBps: 1500, callerStakeLamports: 7_000_000n })], [caller]);
  console.log("open", call.toBase58(), r.sig);
})().catch((e) => { console.error("FAIL", e?.logs ?? "", e?.message ?? e); process.exit(1); });
