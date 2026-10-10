"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Nav } from "@/components/nav";
import { WaxSeal } from "@/components/wax-seal";
import { useSealedProgram } from "@/hooks/use-sealed-program";
import { fetchCalls } from "@/lib/sealed-call-client";
import { type HomeCall, mapCallAccount, staticRecordedCall } from "@/lib/call-list";
import { RECORDED_DEVNET_RUN } from "@/lib/recorded-run";
import { short } from "@/lib/tx";

function Countdown({ to }: { to: number }) {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => { const t = setInterval(() => setNow(Date.now() / 1000), 1000); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.floor(to - now));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return <span className="mono tabular-nums">{s === 0 ? "window closed" : `${hh}:${mm}:${ss}`}</span>;
}

export default function Home() {
  const { connection } = useConnection();
  const program = useSealedProgram();
  const [calls, setCalls] = useState<HomeCall[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const rows = await fetchCalls(program);
        const mapped = rows.map((r) => mapCallAccount(r.publicKey.toBase58(), r.account));
        mapped.forEach((c) => { if (c.address === RECORDED_DEVNET_RUN.call) { c.recorded = true; c.revealTx = RECORDED_DEVNET_RUN.revealTx; } });
        mapped.sort((a, b) => Number(a.revealed) - Number(b.revealed) || b.timestamp - a.timestamp);
        if (alive) setCalls(mapped.length ? mapped : [staticRecordedCall()]);
      } catch {
        if (alive) setCalls([staticRecordedCall()]);
      }
    };
    void load();
    const t = setInterval(load, 20000);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  const now = Date.now() / 1000;
  const open = (calls ?? []).filter((c) => !c.revealed && c.revealDeadline > now);
  const closed = (calls ?? []).filter((c) => c.revealed || c.revealDeadline <= now);

  return (
    <div className="min-h-screen pb-24">
      <Nav />
      <main className="max-w-6xl mx-auto px-5 sm:px-8">
        <section className="grid md:grid-cols-[1.25fr_1fr] gap-10 items-center pt-10 pb-14">
          <div>
            <p className="eyebrow mb-5">Folio Nº 1 — for memecoin callers & the people who follow them</p>
            <h1 className="display text-[56px] sm:text-[84px]">
              The caller<br />buys <em className="text-[var(--wax)]">with</em> you,<br />not before you.
            </h1>
            <p className="mt-7 text-lg text-[var(--ink-2)] max-w-xl leading-relaxed">
              A caller seals the token in a hash and stakes SOL. Followers deposit blind. At reveal, one Solana
              transaction buys for <b>everyone</b>, caller included, at <b>one price</b>. Nobody can front-run a
              ticker they cannot see.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/open" className="btn btn-wax">Seal a call</Link>
              <Link href={`/call?c=${RECORDED_DEVNET_RUN.call}`} className="btn">Watch a reveal</Link>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="sheet w-[320px] h-[220px] rotate-[-3deg] flex flex-col justify-between p-6">
              <div className="flex justify-between eyebrow"><span>Sealed call</span><span>Nº 0417</span></div>
              <div>
                <div className="eyebrow mb-2">Token</div>
                <div className="redact h-7 w-48">CYb9KSmsBEFf7Y7S</div>
              </div>
              <div className="flex justify-between mono text-xs text-[var(--ink-3)]"><span>stake 1.0 SOL</span><span>cap 10 SOL</span></div>
            </div>
            <div className="absolute -bottom-6 right-6 sm:right-14"><WaxSeal size={128} seed="hero" live /></div>
          </div>
        </section>

        <section className="pb-6">
          <div className="flex items-end justify-between">
            <h2 className="display text-4xl">The Ledger</h2>
            <span className="eyebrow">{calls ? `${open.length} sealed · ${closed.length} settled` : "reading devnet…"}</span>
          </div>
          <div className="dbl-rule mt-3" />
          <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_1fr_.8fr_.7fr_1fr] gap-x-4 eyebrow py-3 border-b border-[var(--rule)]">
            <span>Call</span><span className="hidden sm:block">Caller</span><span className="hidden sm:block">Vault</span><span className="hidden sm:block">Followers</span><span className="text-right">Status</span>
          </div>
          {!calls && <div className="py-10 text-center eyebrow">opening the ledger…</div>}
          {[...open, ...closed].map((c, i) => (
            <Link key={c.address} href={`/call?c=${c.address}`} className="rowfill grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_1fr_.8fr_.7fr_1fr] gap-x-4 items-center py-4 border-b border-[var(--rule)] hover:bg-[rgba(154,114,38,.08)] transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="flex items-center gap-3">
                <WaxSeal size={30} seed={c.address} cracked={c.revealed} />
                <span>
                  <span className="mono text-sm">{short(c.address, 5)}</span>
                  {c.recorded && <span className="ml-2 chip text-[var(--brass)]">demo run</span>}
                </span>
              </span>
              <span className="hidden sm:block mono text-sm text-[var(--ink-2)]">{short(c.caller)}</span>
              <span className="hidden sm:block mono text-sm">{c.stake.toFixed(2)} / {c.vaultCap} SOL</span>
              <span className="hidden sm:block mono text-sm">{c.followers}</span>
              <span className="text-right">
                {c.revealed ? <span className="chip text-[var(--moss)]">Revealed · filled</span>
                  : c.revealDeadline > now ? <span className="chip text-[var(--wax)]">Sealed · <Countdown to={c.revealDeadline} /></span>
                  : <span className="chip text-[var(--ink-3)]">Expired · refundable</span>}
              </span>
            </Link>
          ))}
        </section>

        <section id="how" className="pt-16 grid md:grid-cols-3 gap-6">
          {[
            ["I", "Seal", "The caller picks a Meteora DAMM v2 pool and commits sha256(call ‖ mint ‖ pool ‖ salt). Stake goes in the vault. The ticker never touches the chain."],
            ["II", "Gather", "Followers deposit SOL into the same vault, blind. Fee terms, price-impact ceiling and the caller's lock are fixed on-chain before anyone deposits."],
            ["III", "Break the seal", "One reveal transaction checks the hash, the pool's locked liquidity and the mint's safety, then swaps the whole vault. Everyone gets the same price, pro rata."],
          ].map(([n, t, d]) => (
            <div key={n} className="sheet p-7">
              <div className="display text-5xl text-[var(--wax)] italic">{n}</div>
              <h3 className="display text-2xl mt-3">{t}</h3>
              <p className="mt-3 text-[var(--ink-2)] leading-relaxed">{d}</p>
            </div>
          ))}
        </section>
        <p className="mt-10 eyebrow text-center">Unrevealed by the deadline? Every follower takes their SOL back. The caller stays locked after the fill.</p>
      </main>
    </div>
  );
}
