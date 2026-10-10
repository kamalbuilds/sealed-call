import seed from "@/lib/seed-calls.json";
import { callState, type CallAccount } from "@/lib/sealed-call-client";
import { RECORDED_DEVNET_RUN } from "@/lib/recorded-run";

export type Entry = {
  address: string; caller: string; state: "open" | "executed" | "expired";
  stake: number; cap: number; followerLamports: number; followers: number;
  openedAt: number; revealDeadline: number; mint: string; lamportsIn: number; tokensOut: number; executedSlot: string;
};

export const SEED_TAKEN_AT: string = seed.takenAt;
export const seedEntries = (): Entry[] => (seed.calls as any[]).map((c) => ({ ...c, lamportsIn: Number(c.lamportsIn), tokensOut: Number(c.tokensOut) }));

export function fromAccount(address: string, a: CallAccount): Entry {
  return {
    address, caller: a.caller.toBase58(), state: callState(a),
    stake: a.callerStakeLamports.toNumber(), cap: a.maxVaultLamports.toNumber(), followerLamports: a.followerLamports.toNumber(),
    followers: a.followerCount, openedAt: a.openedAt.toNumber(), revealDeadline: a.revealDeadline.toNumber(),
    mint: a.revealedMint.toBase58(), lamportsIn: Number(a.lamportsIn.toString()), tokensOut: Number(a.tokensOut.toString()), executedSlot: a.executedSlot.toString(),
  };
}

/** Positions close on claim, so follower count on an executed call can read 0. The demo run keeps its record. */
export const followerCount = (e: Entry) => (e.address === RECORDED_DEVNET_RUN.call ? Math.max(e.followers, RECORDED_DEVNET_RUN.followerFills.length) : e.followers);
export const sol = (l: number) => l / 1e9;
export const fmtSol = (l: number) => sol(l).toFixed(3);
export const fmtDate = (t: number) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(t * 1000)) + " IST";
