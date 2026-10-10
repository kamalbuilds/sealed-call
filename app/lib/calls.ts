// The seal (mint, pool, salt) never leaves the caller's browser until reveal. Keep it in localStorage and as a file.
export interface SealData {
  call: string;
  callId: string;
  mint: string;
  pool: string;
  salt: string; // hex
  createdAt: number;
}

const key = (call: string) => `sealed_call_seal_${call}`;

export function saveSeal(data: SealData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(data.call), JSON.stringify(data));
}

export function loadSeal(call: string): SealData | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(key(call));
    return s ? (JSON.parse(s) as SealData) : null;
  } catch {
    return null;
  }
}

export function downloadSeal(data: SealData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sealed-call-${data.call.slice(0, 8)}.seal.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
