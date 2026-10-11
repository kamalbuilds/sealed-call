import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import fs from "fs"; import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { makeProgram, sweepDustIx } from "../../sdk/src/index";
const conn = new Connection("https://api.devnet.solana.com", "confirmed");
const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("keys/deployer.json", "utf8"))));
const p = makeProgram(conn, new Wallet(admin));
const call = new PublicKey(process.argv[2]);
// fee split evidence from the reveal tx
const sig = process.argv[3];
const tx = await conn.getTransaction(sig, { maxSupportedTransactionVersion: 0, commitment: "confirmed" });
const keys = tx!.transaction.message.getAccountKeys().staticAccountKeys.map((k) => k.toBase58());
const d = keys.map((k, i) => [k, tx!.meta!.postBalances[i] - tx!.meta!.preBalances[i]]).filter(([, x]) => x !== 0);
console.log("reveal balance deltas", JSON.stringify(d));
const a: any = await p.account.call.fetch(call); console.log("lamportsIn", a.lamportsIn.toString(), "fee fields", JSON.stringify(Object.fromEntries(Object.entries(a).filter(([k]) => /fee/i.test(k)).map(([k, v]: any) => [k, v.toString()]))));
const ixs = await sweepDustIx(p, admin.publicKey, call);
const s = await sendAndConfirmTransaction(conn, new Transaction().add(...(Array.isArray(ixs) ? ixs : [ixs])), [admin]);
console.log("sweep_dust", s);
