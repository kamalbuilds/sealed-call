import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs"; import path from "path";
import { makeProgram, fetchCalls, fetchPositions, fetchConfig } from "../../sdk/src/index";
const conn = new Connection(process.env.RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
const p = makeProgram(conn);
const keys: Record<string,string> = {};
for (const d of ["keys","keys/demo","keys/devnet"]) for (const f of fs.readdirSync(d)) { try { const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(d,f),"utf8")))); keys[kp.publicKey.toBase58()] = `${d}/${f}`; } catch {} }
const now = Date.now()/1000;
const cfg: any = await fetchConfig(p); console.log("config paused", cfg.paused, "fee", cfg.feeBps, "callerShare", cfg.callerFeeShareBps, "minDep", cfg.minDepositLamports.toString());
const calls: any[] = await fetchCalls(p);
for (const c of calls) { const a = c.account; const st = Object.keys(a.state)[0];
  const pos: any[] = await fetchPositions(p, c.publicKey);
  const ex = a.executedAt?.toNumber?.() ?? 0; const unlock = ex + a.callerLockSecs.toNumber();
  console.log(c.publicKey.toBase58(), st, "caller", keys[a.caller.toBase58()] ?? a.caller.toBase58().slice(0,6), "deadline", new Date(a.revealDeadline.toNumber()*1000).toISOString(), now>a.revealDeadline.toNumber()?"PAST":"", st==="executed"?`callerClaimed=${a.callerClaimed} unlockIn=${Math.round(unlock-now)}s`:"",
    "pos:", pos.map(x => `${keys[x.account.follower.toBase58()] ?? x.account.follower.toBase58().slice(0,6)}:${x.account.lamports.toString()}:${x.account.claimed}`).join(" "));
}
