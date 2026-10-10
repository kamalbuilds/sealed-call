"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Masthead } from "@/components/masthead";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Redaction } from "@/components/redaction";
import { useSealedProgram } from "@/hooks/use-sealed-program";
import { fetchCalls } from "@/lib/sealed-call-client";
import { type Entry, fromAccount, seedEntries, SEED_TAKEN_AT, followerCount, fmtSol, fmtDate } from "@/lib/ledger";
import { RECORDED_DEVNET_RUN } from "@/lib/recorded-run";
import { short, explorerTx } from "@/lib/tx";

function status(e: Entry, now: number) {
  if (e.state === "executed") return <span>Filled</span>;
  if (e.state === "expired" || now > e.revealDeadline) return <span className="muted">Lapsed<span className="hidden sm:inline">, refundable</span></span>;
  const s = Math.max(0, Math.floor(e.revealDeadline - now));
  return <span className="red">Sealed, <span className="lining">{Math.floor(s / 3600)}h {Math.floor((s % 3600) / 60)}m</span> left</span>;
}

export function LedgerView() {
  const { connection } = useConnection();
  const program = useSealedProgram();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(seedEntries);
  const [live, setLive] = useState(false);
  const [readAt, setReadAt] = useState("");
  const [slot, setSlot] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now() / 1000);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const rows = await fetchCalls(program);
        connection.getSlot().then((n) => alive && setSlot(n)).catch(() => {});
        if (!alive || rows.length === 0) return;
        setEntries(rows.map((r) => fromAccount(r.publicKey.toBase58(), r.account)).sort((a, b) => a.openedAt - b.openedAt));
        setLive(true); setReadAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }));
      } catch { /* keep the snapshot */ }
    };
    void load();
    const t = setInterval(load, 20000), c = setInterval(() => setNow(Date.now() / 1000), 30000);
    return () => { alive = false; clearInterval(t); clearInterval(c); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  const numbered = entries.map((e, i) => ({ e, n: i + 1 })).reverse();
  const filled = entries.filter((e) => e.state === "executed");

  return (
    <div className="pb-24">
      <Masthead />
      <main className="frame mt-12">
        <section className="col">
          <h1 className="t3" style={{ maxWidth: "26em" }}>The caller buys with you, in the same transaction, at the same price.</h1>
          <Link href="/open/" className="btn btn-seal mt-6 md:hidden">Seal a call</Link>
          <div className="mt-8 flex items-baseline justify-between gap-4 heavy-t pt-3">
            <h2 className="t2 strong">The ledger of sealed calls</h2>
            
          </div>
          <p className="mt-6"><span className="display t5 lining">{fmtSol(entries.reduce((t, e) => t + e.stake + e.followerLamports, 0))}</span> <span className="t3">SOL sealed across {entries.length} calls, {filled.length} filled at one price each.</span></p>
          <p className="t1 muted mt-1">Sum of the vault column, {live && readAt ? `read from devnet${slot ? ` at slot ${slot.toLocaleString("en-US")}` : ""}, ${readAt} IST` : `devnet snapshot of ${new Date(SEED_TAKEN_AT).toLocaleDateString("en-GB")}`}.</p>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>№</TableHead><TableHead>Token</TableHead><TableHead className="hidden sm:table-cell">Caller</TableHead><TableHead className="r">Vault<span className="hidden sm:inline">, SOL</span></TableHead><TableHead className="r hidden sm:table-cell">Followers</TableHead><TableHead className="r">Entry</TableHead></TableRow></TableHeader>
              <TableBody>
                {numbered.map(({ e, n }) => (
                  <TableRow key={e.address} className="row" tabIndex={0} onClick={() => router.push(`/call/?c=${e.address}`)} onKeyDown={(k) => k.key === "Enter" && router.push(`/call/?c=${e.address}`)}>
                    <TableCell className="num">№&thinsp;{n}{e.state === "executed" && <sup className="fn">{filled.indexOf(e) + 1}</sup>}</TableCell>
                    <TableCell><Redaction text={short(e.mint, 4)} open={e.state === "executed"} chars={9} className="hash" /><div className="hash muted sm:hidden mt-1">by {short(e.caller)}</div></TableCell>
                    <TableCell className="hidden sm:table-cell"><span className="hash muted">{short(e.caller)}</span></TableCell>
                    <TableCell className="r lining">{fmtSol(e.stake + e.followerLamports)}<span className="muted hidden sm:inline"> / {fmtSol(e.cap)}</span></TableCell>
                    <TableCell className="r lining hidden sm:table-cell">{e.state === "executed" && followerCount(e) === 0 && e.followerLamports > 0 ? <span className="muted t1">all claimed</span> : followerCount(e)}</TableCell>
                    <TableCell className="r t1">{status(e, now)}<div className="muted">{fmtDate(e.openedAt)}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-16 heavy-t pt-3">
            <h2 className="t2 strong">The record of № 1, as it happened on devnet</h2>
            <ol className="mt-3">
              {[
                ["5 Oct 2026", "The caller sealed the call: 0.006 SOL stake and a sha256 commitment. The token stayed off chain.", RECORDED_DEVNET_RUN.openTx],
                ...RECORDED_DEVNET_RUN.depositTxs.map((t, i) => ["", `A follower deposited ${fmtSol(RECORDED_DEVNET_RUN.followerFills[i].lamports)} SOL without knowing the token.`, t]),
                ["", "A reveal with the wrong salt was rejected by the program.", RECORDED_DEVNET_RUN.rejectedRevealTx],
                ["", "The real reveal: one swap filled the caller and all three followers at one price, slot 507,691,251.", RECORDED_DEVNET_RUN.revealTx],
              ].map(([d, what, tx]) => (
                <li key={tx} className="grid gap-x-6 py-3 rule-b sm:grid-cols-[128px_minmax(0,1fr)_auto]">
                  <span className="t1 muted lining">{d}</span>
                  <span>{what}</span>
                  <a className="textlink hash t1" href={explorerTx(tx)} target="_blank" rel="noreferrer">{short(tx, 5)}</a>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-16 heavy-t pt-3 grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="t2 strong">How it pays</h2>
              <p className="mt-3">Every filled vault pays a 1% fee, which the program takes in the reveal transaction. A lapsed call refunds in full and pays nothing.</p>
              <p className="mt-3">Of that fee, 30% goes to the caller and 70% to the protocol treasury, both set in the on-chain config, so a caller earns only when followers fill alongside them.</p>
              <p className="mt-3 muted">Next: a caller subscription for a verified track-record page and private follower lists. Planned, not built.</p>
            </div>
            <div>
              <h2 className="t2 strong">Who asked for it</h2>
              <ul className="mt-3 grid gap-3">
                <li>Mechanisms that only work with hiding or batching, asked for by <a className="textlink" href="https://x.com/milianstx/status/2098040544744112212" target="_blank" rel="noreferrer">@milianstx</a>.</li>
                <li>Callers under 50K market cap get &ldquo;bundled sniped and farmed&rdquo;, <a className="textlink" href="https://x.com/slingoorio/status/2105210573663174817" target="_blank" rel="noreferrer">@slingoorio</a> <span className="muted">(post since protected; text archived)</span>.</li>
                <li>&ldquo;the ones who keep getting bundled&rdquo;, <a className="textlink" href="https://x.com/skrootimburg/status/2105973149053448320" target="_blank" rel="noreferrer">@skrootimburg</a>.</li>
                <li>Followers fill 1 to 2 seconds late and sell into the caller&rsquo;s red candle, <a className="textlink" href="https://www.reddit.com/r/GMGNAI/comments/1wf6doe/copytrading/" target="_blank" rel="noreferrer">r/GMGNAI</a>.</li>
              </ul>
            </div>
          </div>
        </section>
        <aside className="margin">
          <Link href="/open/" className="btn btn-seal mb-8 hidden md:inline-flex">Seal a call</Link>
          {filled.map((e, i) => (
            <p key={e.address} className="mb-4"><sup className="fn">{i + 1}</sup> Filled at slot {e.executedSlot}{e.address === RECORDED_DEVNET_RUN.call && <>; record below</>}.</p>
          ))}
          <p className="mb-4">One reveal checks the hash, the pool and the mint, then swaps the whole vault through Meteora DAMM v2.</p>
          <p className="mb-4">№ 1 and № 3 are two calls by one caller on the same devnet pool, so they share a token.</p>
        </aside>

      </main>
    </div>
  );
}
