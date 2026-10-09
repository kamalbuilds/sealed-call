// Local storage management for sealed call data

export interface SealData {
  callId: string;
  mint: string;
  pool: string;
  salt: string;
  call: string;
}

export function saveSeal(callId: string, data: SealData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`sealed_${callId}`, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save seal:", e);
  }
}

export function loadSeal(callId: string): SealData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`sealed_${callId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Failed to load seal:", e);
    return null;
  }
}

export function loadCallStream(): any[] {
  return [];
}

export function mapCall(data: any): any {
  return data;
}
