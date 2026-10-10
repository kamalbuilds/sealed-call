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
