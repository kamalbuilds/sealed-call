import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

export interface WalletSigner {
  publicKey: PublicKey;
  signTransaction<T extends Transaction>(transaction: T): Promise<T>;
}

/** Sign, send and wait for confirmation. Throws with logs when simulation or execution fails. */
export async function sendInstructions(connection: Connection, wallet: WalletSigner, instructions: TransactionInstruction[]): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const transaction = new Transaction({ feePayer: wallet.publicKey, recentBlockhash: blockhash });
  transaction.add(...instructions);
  const sim = await connection.simulateTransaction(transaction);
  if (sim.value.err) {
    const e: any = new Error(`Simulation failed: ${JSON.stringify(sim.value.err)}`);
    e.logs = sim.value.logs ?? [];
    throw e;
  }
  const signed = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());
  const res = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (res.value.err) throw new Error(`Transaction failed: ${JSON.stringify(res.value.err)}`);
  return signature;
}

export const explorerTx = (sig: string, cluster = "devnet") => `https://explorer.solana.com/tx/${sig}?cluster=${cluster}`;
export const explorerAddr = (a: string, cluster = "devnet") => `https://explorer.solana.com/address/${a}?cluster=${cluster}`;
export const short = (a: string, n = 4) => (a.length > 2 * n + 1 ? `${a.slice(0, n)}…${a.slice(-n)}` : a);
export const sol = (lamports: number | bigint) => Number(lamports) / 1e9;

export type Prepared = { tx: Transaction; blockhash: string; lastValidBlockHeight: number; feeLamports: number; balanceDelta: number | null; simError: any | null; logs: string[]; units: number | null };

/** Build and simulate without signing, so the UI can show the outcome before the wallet prompt. */
export async function prepareTx(connection: Connection, payer: PublicKey, instructions: TransactionInstruction[]): Promise<Prepared> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash });
  tx.add(...instructions);
  const [before, sim, fee] = await Promise.all([
    connection.getBalance(payer, "confirmed"),
    connection.simulateTransaction(tx, undefined, [payer]),
    connection.getFeeForMessage(tx.compileMessage(), "confirmed").then((f) => f.value ?? 5000).catch(() => 5000),
  ]);
  const after = sim.value.accounts?.[0]?.lamports;
  return { tx, blockhash, lastValidBlockHeight, feeLamports: fee, balanceDelta: typeof after === "number" ? after - before : null, simError: sim.value.err ? { message: `Simulation failed: ${JSON.stringify(sim.value.err)}`, logs: sim.value.logs ?? [] } : null, logs: sim.value.logs ?? [], units: sim.value.unitsConsumed ?? null };
}

/** Sign and send a prepared transaction. onSent fires with the signature while it is still pending. */
export async function sendPrepared(connection: Connection, wallet: WalletSigner, p: Prepared, onSent?: (sig: string) => void): Promise<string> {
  const signed = await wallet.signTransaction(p.tx);
  const signature = await connection.sendRawTransaction(signed.serialize());
  onSent?.(signature);
  const res = await connection.confirmTransaction({ signature, blockhash: p.blockhash, lastValidBlockHeight: p.lastValidBlockHeight }, "confirmed");
  if (res.value.err) { const e: any = new Error(`Transaction failed: ${JSON.stringify(res.value.err)}`); e.signature = signature; throw e; }
  return signature;
}
