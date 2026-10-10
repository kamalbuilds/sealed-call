import type { CallAccount } from "@/lib/sealed-call-client";
import { callState } from "@/lib/sealed-call-client";
import { RECORDED_DEVNET_RUN } from "@/lib/recorded-run";

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
  recorded?: boolean;
  revealTx?: string;
}

function commitmentHex(commitment: number[]): string {
  return Buffer.from(commitment).toString("hex");
}

export function mapCallAccount(publicKey: string, account: CallAccount): HomeCall {
  const state = callState(account);
  const revealed = state === "executed";
  const lamportsIn = account.lamportsIn.toNumber();
  const tokensOut = account.tokensOut.toNumber();
  let fillPrice: number | undefined;
  if (revealed && lamportsIn > 0 && tokensOut > 0) {
    fillPrice = tokensOut / lamportsIn / 1e6;
  }

  return {
    address: publicKey,
    caller: account.caller.toBase58(),
    seal: commitmentHex(account.commitment),
    stake: account.callerStakeLamports.toNumber() / 1e9,
    vaultCap: account.maxVaultLamports.toNumber() / 1e9,
    followers: account.followerCount,
    revealDeadline: account.revealDeadline.toNumber(),
    revealed,
    fillPrice,
    timestamp: account.openedAt.toNumber(),
  };
}

export function staticRecordedCall(): HomeCall {
  return {
    address: RECORDED_DEVNET_RUN.call,
    caller: RECORDED_DEVNET_RUN.caller,
    seal: "",
    stake: 1,
    vaultCap: 10,
    followers: RECORDED_DEVNET_RUN.followerCount,
    revealDeadline: 0,
    revealed: true,
    timestamp: Math.floor(new Date(RECORDED_DEVNET_RUN.completedAt).getTime() / 1000),
    recorded: true,
    revealTx: RECORDED_DEVNET_RUN.revealTx,
  };
}
