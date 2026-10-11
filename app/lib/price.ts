"use client";
import { useEffect, useState } from "react";

export type SolPrice = { usd: number; at: number; source: string };
let cache: SolPrice | null = null;
let inflight: Promise<SolPrice | null> | null = null;

async function load(): Promise<SolPrice | null> {
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_last_updated_at=true");
    const j = await r.json();
    if (typeof j?.solana?.usd === "number") return { usd: j.solana.usd, at: (j.solana.last_updated_at ?? Date.now() / 1000) * 1000, source: "CoinGecko" };
  } catch { /* try the next source */ }
  try {
    const r = await fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot");
    const j = await r.json(); const v = parseFloat(j?.data?.amount);
    if (Number.isFinite(v)) return { usd: v, at: Date.now(), source: "Coinbase" };
  } catch { /* no price */ }
  return null;
}

/** Real SOL/USD from a public API with its fetch time. Null when unavailable: callers hide USD, never guess it. */
export function useSolPrice(): SolPrice | null {
  const [p, setP] = useState<SolPrice | null>(cache);
  useEffect(() => {
    let alive = true;
    const go = () => { inflight = inflight ?? load().finally(() => { inflight = null; }); inflight.then((v) => { if (v) cache = v; if (alive && v) setP(v); }); };
    go(); const t = setInterval(go, 120000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return p;
}

export const usd = (sol: number, p: SolPrice | null) => (p ? `~$${(sol * p.usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null);
export const priceStamp = (p: SolPrice) => `SOL $${p.usd.toFixed(2)} via ${p.source}, ${new Date(p.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST`;
export const localTime = (unix: number) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(unix * 1000)) + " IST";
