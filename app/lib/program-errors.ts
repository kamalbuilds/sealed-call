import { idl } from "@/lib/sealed-call-client";

const ERRORS: Record<number, string> = Object.fromEntries(
  ((idl as any).errors ?? []).map((e: any) => [e.code, e.msg ?? e.name]),
);

export function mapProgramError(error: any): string {
  const code = error?.error?.errorCode?.number ?? error?.code;
  if (typeof code === "number" && ERRORS[code]) return `${ERRORS[code]} (${code})`;
  const text = [error?.message, ...(error?.logs ?? []), ...(error?.transactionLogs ?? [])].join("\n");
  const hex = text.match(/custom program error: 0x([0-9a-f]+)/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    if (ERRORS[n]) return `${ERRORS[n]} (${n})`;
  }
  const named = text.match(/Error Number: (\d+)/);
  if (named && ERRORS[+named[1]]) return `${ERRORS[+named[1]]} (${named[1]})`;
  if (/User rejected/i.test(text)) return "You declined in the wallet.";
  if (/insufficient lamports|Attempt to debit/i.test(text)) return "Not enough devnet SOL. Use faucet.solana.com.";
  return error?.message ?? "Unknown error";
}
