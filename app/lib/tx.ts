import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";

export interface WalletSigner {
  publicKey: PublicKey;
  signTransaction<T extends Transaction>(transaction: T): Promise<T>;
}

export async function sendInstructions(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[]
): Promise<string> {
  const { blockhash } = await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    feePayer: wallet.publicKey,
    recentBlockhash: blockhash,
  });

  transaction.add(...instructions);

  const signed = await wallet.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
  });

  return signature;
}

export function explorerTx(signature: string, cluster: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
