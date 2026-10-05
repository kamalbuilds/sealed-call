import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BaseFeeMode,
  CollectFeeMode,
  CpAmm,
  MAX_SQRT_PRICE,
  MIN_SQRT_PRICE,
  getBaseFeeParams,
} from "@meteora-ag/cp-amm-sdk";
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendTransactionError,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import BN from "bn.js";

import { poolSides, readPool, type PoolInfo } from "../sdk/src/index";

export const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:18899";
export const connection = new Connection(RPC_URL, "confirmed");

export const loadKeypair = (path: string): Keypair =>
  Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(resolve(path), "utf8"))));

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function lamports(pk: PublicKey): Promise<bigint> {
  return BigInt(await connection.getBalance(pk, "confirmed"));
}

export async function tokenBalance(account: PublicKey): Promise<bigint> {
  return (await getAccount(connection, account, "confirmed")).amount;
}

export async function accountExists(pk: PublicKey): Promise<boolean> {
  return (await connection.getAccountInfo(pk, "confirmed")) !== null;
}

export async function airdrop(pk: PublicKey, sol: number): Promise<void> {
  const sig = await connection.requestAirdrop(pk, sol * LAMPORTS_PER_SOL);
  await confirm(sig);
}

async function confirm(sig: string): Promise<void> {
  for (let i = 0; i < 120; i++) {
    const st = (await connection.getSignatureStatuses([sig])).value[0];
    if (st?.err) throw new Error(`tx ${sig} failed: ${JSON.stringify(st.err)}`);
    if (st && (st.confirmationStatus === "confirmed" || st.confirmationStatus === "finalized")) return;
    await sleep(250);
  }
  throw new Error(`tx ${sig} not confirmed within 30s`);
}

export type Sent = { sig: string; size: number };

export async function send(ixs: TransactionInstruction[], signers: Keypair[]): Promise<Sent> {
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: signers[0].publicKey, recentBlockhash: blockhash });
  tx.add(...ixs);
  tx.sign(...signers);
  const raw = tx.serialize();
  const sig = await connection.sendRawTransaction(raw, { preflightCommitment: "confirmed" });
  await confirm(sig);
  return { sig, size: raw.length };
}

/** Sends a transaction that must be rejected and returns the Anchor error name it was rejected with. */
export async function failure(ixs: TransactionInstruction[], signers: Keypair[]): Promise<{ name: string; number: number; text: string }> {
  let err: unknown;
  try {
    await send(ixs, signers);
  } catch (e) {
    err = e;
  }
  if (err === undefined) throw new Error("transaction succeeded but was expected to fail");
  let logs: string[] = [];
  if (err instanceof SendTransactionError) logs = err.logs ?? (await err.getLogs(connection)) ?? [];
  const text = logs.join("\n") + "\n" + String((err as Error).message);
  const m = /Error Code: (\w+)\. Error Number: (\d+)/.exec(text);
  return { name: m ? m[1] : "", number: m ? Number(m[2]) : -1, text };
}

export async function expectFail(ixs: TransactionInstruction[], signers: Keypair[], name: string): Promise<void> {
  const f = await failure(ixs, signers);
  if (f.name !== name) throw new Error(`expected ${name}, got ${f.name} (${f.number})\n${f.text}`);
}

export async function computeUnits(sig: string): Promise<number> {
  for (let i = 0; i < 40; i++) {
    const tx = await connection.getTransaction(sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    if (tx?.meta?.computeUnitsConsumed !== undefined) return Number(tx.meta.computeUnitsConsumed);
    await sleep(250);
  }
  throw new Error(`no compute units for ${sig}`);
}

export async function chainTime(): Promise<number> {
  const slot = await connection.getSlot("confirmed");
  for (let s = slot; s > slot - 20; s--) {
    const t = await connection.getBlockTime(s).catch(() => null);
    if (t !== null) return t;
  }
  throw new Error("no block time");
}

export async function waitUntilChainTime(unix: number): Promise<void> {
  for (let i = 0; i < 600; i++) {
    if ((await chainTime()) >= unix) return;
    await sleep(500);
  }
  throw new Error(`chain time never reached ${unix}`);
}

/** A fresh mint whose pubkey sorts below (`below`) or above wSOL, so both pool orientations get exercised. */
export function grindMint(below: boolean): Keypair {
  for (;;) {
    const kp = Keypair.generate();
    if (Buffer.compare(kp.publicKey.toBuffer(), NATIVE_MINT.toBuffer()) === (below ? -1 : 1)) return kp;
  }
}

export async function makeMeme(payer: Keypair, below: boolean, supply: bigint): Promise<PublicKey> {
  const kp = grindMint(below);
  const mint = await createMint(connection, payer, payer.publicKey, null, 6, kp, { commitment: "confirmed" }, TOKEN_PROGRAM_ID);
  const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey, false, "confirmed");
  await mintTo(connection, payer, mint, ata.address, payer, supply, [], { commitment: "confirmed" });
  return mint;
}

/** Real DAMM v2 customizable pool, full price range, 25 bps flat fee. Returns the decoded pool. */
export async function createPool(
  payer: Keypair,
  mint: PublicKey,
  solLiquidity: bigint,
  tokenLiquidity: bigint,
): Promise<PoolInfo> {
  const cpAmm = new CpAmm(connection);
  const wsolIsA = Buffer.compare(NATIVE_MINT.toBuffer(), mint.toBuffer()) < 0;
  const tokenAMint = wsolIsA ? NATIVE_MINT : mint;
  const tokenBMint = wsolIsA ? mint : NATIVE_MINT;
  const tokenAAmount = new BN((wsolIsA ? solLiquidity : tokenLiquidity).toString());
  const tokenBAmount = new BN((wsolIsA ? tokenLiquidity : solLiquidity).toString());
  const { initSqrtPrice, liquidityDelta } = cpAmm.preparePoolCreationParams({
    tokenAAmount,
    tokenBAmount,
    minSqrtPrice: MIN_SQRT_PRICE,
    maxSqrtPrice: MAX_SQRT_PRICE,
    collectFeeMode: CollectFeeMode.BothToken,
  });
  const positionNft = Keypair.generate();
  const { tx, pool } = await cpAmm.createCustomPool({
    payer: payer.publicKey,
    creator: payer.publicKey,
    positionNft: positionNft.publicKey,
    tokenAMint,
    tokenBMint,
    tokenAAmount,
    tokenBAmount,
    sqrtMinPrice: MIN_SQRT_PRICE,
    sqrtMaxPrice: MAX_SQRT_PRICE,
    liquidityDelta,
    initSqrtPrice,
    poolFees: {
      baseFee: getBaseFeeParams({
        baseFeeMode: BaseFeeMode.FeeTimeSchedulerLinear,
        feeTimeSchedulerParam: { startingFeeBps: 25, endingFeeBps: 25, numberOfPeriod: 0, totalDuration: 0 },
      }),
      compoundingFeeBps: 0,
      padding: 0,
      dynamicFee: null,
    },
    hasAlphaVault: false,
    activationType: 1,
    collectFeeMode: CollectFeeMode.BothToken,
    activationPoint: null,
    tokenAProgram: TOKEN_PROGRAM_ID,
    tokenBProgram: TOKEN_PROGRAM_ID,
  });
  await send(
    [ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }), ...tx.instructions],
    [payer, positionNft],
  );
  const info = await readPool(connection, pool);
  if (poolSides(info).wsolIsA !== wsolIsA) throw new Error("pool orientation differs from the requested one");
  return info;
}
