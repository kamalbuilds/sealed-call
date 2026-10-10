// Prints the live devnet Config fee terms (source for the README business model). usage: npx tsx scripts/fee-config.ts
import { Connection } from "@solana/web3.js";
import { makeProgram, configPda } from "../sdk/src/index";
(async () => {
  const program = makeProgram(new Connection(process.env.RPC_URL ?? "https://api.devnet.solana.com", "confirmed"));
  const cfg: any = await (program.account as any).config.fetch(configPda());
  console.log(JSON.stringify({ config: configPda().toBase58(), feeBps: cfg.feeBps, callerFeeShareBps: cfg.callerFeeShareBps, treasury: cfg.treasury.toBase58(), paused: cfg.paused }));
})();
