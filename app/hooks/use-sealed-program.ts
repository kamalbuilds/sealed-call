"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { makeProgram, type SealedProgram } from "@/lib/sealed-call-client";
import type { Wallet } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";

export function useSealedProgram(): SealedProgram {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  if (!connection) {
    throw new Error("No connection available");
  }

  const walletAdapter: Wallet | undefined =
    publicKey && signTransaction
      ? {
          publicKey,
          signTransaction: signTransaction as any,
          signAllTransactions: async (txs) => {
            const signed = await Promise.all(txs.map((tx) => signTransaction(tx as any)));
            return signed;
          },
          payer: Keypair.generate(),
        }
      : undefined;

  return makeProgram(connection, walletAdapter);
}
