#!/usr/bin/env tsx
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

import {
  PROGRAM_ID,
  callState,
  configPda,
  fetchCalls,
  fetchConfig,
  fetchPositions,
  makeProgram,
} from "../sdk/src/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type DemoRun = {
  happy?: { followers?: string[] };
};

const lamportsToSol = (n: bigint | number) => Number(n) / LAMPORTS_PER_SOL;

function parseArgs(argv: string[]) {
  let rpc = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
  let demoPath: string | null = null;
  let noDemo = false;
  let json = false;
  let showHelp = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--rpc" || arg === "-r") {
      if (argv[i + 1]) {
        rpc = argv[++i]!;
      }
    } else if (arg === "--demo") {
      if (argv[i + 1]) {
        demoPath = resolve(argv[++i]!);
      }
    } else if (arg === "--no-demo") {
      noDemo = true;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--help" || arg === "-h" || arg === "help") {
      showHelp = true;
    } else if (arg === "stats") {
      // Subcommand accepted per spec
    }
  }

  return { rpc, demoPath, noDemo, json, showHelp };
}

async function main() {
  const argv = process.argv.slice(2);
  const { rpc, demoPath, noDemo, json, showHelp } = parseArgs(argv);

  if (showHelp) {
    console.log(`Usage: sealed-call stats [options]

Print on-chain stats for sealed-call directly from Solana accounts (no database).

Options:
  --rpc, -r <url>    Solana RPC URL (default: SOLANA_RPC_URL or https://api.devnet.solana.com)
  --demo <path>      Path to demo run JSON to seed follower wallets if positions closed
  --no-demo          Skip reading local demo run artifacts
  --json             Output stats in JSON format
  -h, --help         Show this help message
`);
    return;
  }

  const connection = new Connection(rpc, "confirmed");
  const program = makeProgram(connection);
  const expectedConfigPda = configPda();

  const [calls, config] = await Promise.all([
    fetchCalls(program),
    fetchConfig(program),
  ]);

  const executed = calls.filter((c) => callState(c.account) === "executed");

  const followerWallets = new Set<string>();
  let volumeLamports = 0n;

  for (const { account, publicKey: callPk } of executed) {
    volumeLamports += BigInt(account.lamportsIn.toString());
    const positions = await fetchPositions(program, callPk);
    for (const p of positions) {
      followerWallets.add(p.account.follower.toBase58());
    }
  }

  const defaultDemo = resolve(__dirname, "../demo/devnet-run.json");
  const demoTarget = noDemo ? null : (demoPath ?? (existsSync(defaultDemo) ? defaultDemo : null));
  let demoFollowersCount = 0;
  if (demoTarget && existsSync(demoTarget)) {
    try {
      const demo = JSON.parse(readFileSync(demoTarget, "utf8")) as DemoRun;
      if (demo.happy?.followers) {
        demoFollowersCount = demo.happy.followers.length;
        for (const f of demo.happy.followers) {
          followerWallets.add(f);
        }
      }
    } catch {
      // Ignore parse errors on demo file
    }
  }

  const feeVaultPubkey = config.treasury;
  const feeVaultBalanceLamports = BigInt(await connection.getBalance(feeVaultPubkey, "confirmed"));

  const stats = {
    programId: PROGRAM_ID.toBase58(),
    configPda: expectedConfigPda.toBase58(),
    feeVaultPubkey: feeVaultPubkey.toBase58(),
    rpc,
    callsExecuted: executed.length,
    distinctFollowerWallets: followerWallets.size,
    volumeSol: lamportsToSol(volumeLamports),
    volumeLamports: volumeLamports.toString(),
    feeVaultBalanceSol: lamportsToSol(feeVaultBalanceLamports),
    feeVaultBalanceLamports: feeVaultBalanceLamports.toString(),
  };

  if (json) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log(`sealed-call on-chain stats
--------------------------
Program ID:                 ${stats.programId}
Config PDA:                 ${stats.configPda}
Fee vault:                  ${stats.feeVaultPubkey}
RPC:                        ${stats.rpc}

calls executed (revealed state): ${stats.callsExecuted}
distinct follower wallets across revealed calls: ${stats.distinctFollowerWallets}
volume (sum vault SOL swapped on reveal): ${stats.volumeSol} SOL (${stats.volumeLamports} lamports)
fee vault balance: ${stats.feeVaultBalanceSol} SOL (${stats.feeVaultBalanceLamports} lamports)`);
}

main().catch((e) => {
  console.error("Failed to read on-chain stats:", e);
  process.exit(1);
});
