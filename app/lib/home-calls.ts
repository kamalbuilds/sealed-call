import type { CallAccount } from "@/lib/sealed-call-client";
import { callState } from "@/lib/sealed-call-client";
import { PublicKey } from "@solana/web3.js";

export interface HomeCall {
  address: string;
  caller: string;
  seal: string;
  stake: number;
  vaultCap: number;
  followers: number;
  revealDeadline: number;
  revealed: boolean;
  fillPrice?: number;
  timestamp: number;
  source: "chain" | "recorded";
  revealTx?: string;
}

function bytesToHex(bytes: number[] | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function mapCallAccount(
  publicKey: PublicKey,
  account: CallAccount,
): HomeCall {
  const lamportsIn = account.lamportsIn.toNumber();
  const tokensOut = account.tokensOut.toNumber();
  const executed = callState(account) === "executed";

  return {
    address: publicKey.toBase58(),
    caller: account.caller.toBase58(),
    seal: bytesToHex(account.commitment as number[]),
    stake: account.callerStakeLamports.toNumber() / 10 ** 9,
    vaultCap: account.maxVaultLamports.toNumber() / 10 ** 9,
    followers: account.followerCount,
    revealDeadline: account.revealDeadline.toNumber(),
    revealed: executed,
    fillPrice:
      executed && lamportsIn > 0
        ? tokensOut / lamportsIn / 10 ** 9
        : undefined,
    timestamp: account.openedAt.toNumber(),
    source: "chain",
  };
}
