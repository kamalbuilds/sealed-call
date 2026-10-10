// Snapshot the latest devnet calls so the ledger never opens empty. usage: npx tsx scripts/seed-calls.ts
import { writeFileSync } from "node:fs";
import { Connection } from "@solana/web3.js";
import { makeProgram, fetchCalls, callState } from "../sdk/src/index";
import { PublicKey } from "@solana/web3.js";
const connection = new Connection(process.env.RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
(async () => {
  const program = makeProgram(connection);
  const rows = await fetchCalls(program);
  const out = rows.map(({ publicKey, account: a }) => ({
    address: publicKey.toBase58(), caller: a.caller.toBase58(), state: callState(a),
    stake: a.callerStakeLamports.toNumber(), cap: a.maxVaultLamports.toNumber(), followerLamports: a.followerLamports.toNumber(),
    followers: a.followerCount, openedAt: a.openedAt.toNumber(), revealDeadline: a.revealDeadline.toNumber(),
    mint: a.revealedMint.toBase58(), lamportsIn: a.lamportsIn.toString(), tokensOut: a.tokensOut.toString(), executedSlot: a.executedSlot.toString(),
  })).sort((x, y) => x.openedAt - y.openedAt);
  const raw = await connection.getMultipleAccountsInfo(out.map((c) => new PublicKey(c.address)));
  out.forEach((c: any, i) => { c.raw = raw[i]?.data.toString("base64"); });
  writeFileSync("app/lib/seed-calls.json", JSON.stringify({ takenAt: new Date().toISOString(), calls: out }, null, 2));
  console.log(out.length, "calls");
})();
