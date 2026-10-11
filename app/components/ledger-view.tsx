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
import { short, explorerTx, explorerAddr } from "@/lib/tx";
import { Badge } from "@/components/ui/badge";
import { Metric } from "@/components/metric";


function status(e: Entry, now: number) {
  if (e.state === "executed") return <Badge tone="filled">Filled</Badge>;
  if (e.state === "expired") return <Badge tone="muted">Lapsed</Badge>;
  if (now > e.revealDeadline) return <Badge tone="lapsed">Refundable</Badge>;
  const s = Math.max(0, Math.floor(e.revealDeadline - now));
  return <Badge tone="open">Open <span className="lining">{Math.floor(s / 3600)}h {Math.floor((s % 3600) / 60)}m</span></Badge>;
}

const EVIDENCE: [string, string, string, string?][] = [
  ["Mechanisms that only work with hiding or batching", "@milianstx", "https://x.com/milianstx/status/2098040544744112212"],
  ["Callers under 50K market cap get \u201cbundled sniped and farmed\u201d", "@slingoorio", "https://x.com/slingoorio/status/2105210573663174817", "post since protected; text archived"],
  ["\u201cthe ones who keep getting bundled\u201d", "@skrootimburg", "https://x.com/skrootimburg/status/2105973149053448320"],
  ["Followers fill 1 to 2 seconds late and sell into the caller\u2019s red candle", "r/GMGNAI", "https://www.reddit.com/r/GMGNAI/comments/1wf6doe/copytrading/"],
];

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

  const total = entries.reduce((t, e) => t + e.stake + e.followerLamports, 0);
  const openNow = entries.filter((e) => e.state === "open" && now <= e.revealDeadline).length;
  const callers = new Set(entries.map((e) => e.caller)).size;
  const followersTotal = entries.reduce((t, e) => t + followerCount(e), 0);
  const source = live && readAt ? `Live from devnet${slot ? `, slot ${slot.toLocaleString("en-US")}` : ""}, ${readAt} IST` : `Devnet snapshot, ${new Date(SEED_TAKEN_AT).toLocaleDateString("en-GB")}`;
  const record: [string, string, string][] = [
    ["Sealed", "Caller staked 0.006 SOL behind a sha256 commitment. Token stays off chain.", RECORDED_DEVNET_RUN.openTx],
    ...RECORDED_DEVNET_RUN.depositTxs.map((t, i): [string, string, string] => [`Deposit ${i + 1}`, `Follower put in ${fmtSol(RECORDED_DEVNET_RUN.followerFills[i].lamports)} SOL blind.`, t]),
    ["Rejected", "Reveal with a wrong salt, refused by the program.", RECORDED_DEVNET_RUN.rejectedRevealTx],
    ["Filled", "One swap for caller and three followers, slot 507,691,251.", RECORDED_DEVNET_RUN.revealTx],
  ];

  return (
    <div className="pb-24">
      <Masthead />
      <main className="shell mt-8 md:mt-12 grid gap-6">
        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className="chip chip-muted chip-plain">Program <span className="hash t1">{short(RECORDED_DEVNET_RUN.programId, 4)}</span></span><span className={`chip ${live ? "chip-filled" : "chip-muted"}`}>{live ? "Live" : "Snapshot"}</span></div>
            <h1 className="display t6 mt-4" style={{ maxWidth: "18em" }}>Sealed calls. One fill, one price.</h1>
            <p className="t3 muted mt-2" style={{ maxWidth: "40em" }}>The caller buys with followers in the same transaction. Nobody sees the token until reveal, so nobody can front-run it.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/try/" className="btn btn-line btn-lg">Try it in 60s</Link>
            <Link href="/open/" className="btn btn-seal btn-lg">Seal a call</Link>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" aria-label="Ledger summary">
          <Metric value={fmtSol(total)} unit="SOL" label="Sealed in vaults" accent />
          <Metric value={entries.length} label="Calls" sub={`${callers} caller wallets`} />
          <Metric value={filled.length} label="Filled at one price" sub={`${followersTotal} follower fills`} />
          <Metric value={openNow} label="Open for deposits" sub={openNow ? "Join blind as a follower" : "Seal one to start"} />
        </section>

        <section className="card overflow-hidden">
          <div className="card-h">
            <div><h2 className="t4">Call ledger</h2><p className="t1 muted mt-1">{source}</p></div>
            <span className="t1 muted hidden sm:block">Refreshes every 20 s</span>
          </div>
          <ul className="sm:hidden">
            {numbered.map(({ e, n }) => (
              <li key={e.address}>
                <Link href={`/call/?c=${e.address}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-4 py-3 rule-b transition-colors hover:bg-[var(--surface-elevated)]">
                  <span className="flex items-center gap-2 min-w-0"><span className="hash t1 muted">#{n}</span>{status(e, now)}</span>
                  <span className="hash ink text-right">{fmtSol(e.stake + e.followerLamports)} <span className="muted t1">SOL</span></span>
                  <span className="flex items-center gap-2 min-w-0 t1 muted">Token <Redaction text={short(e.mint, 4)} open={e.state === "executed"} chars={9} className="hash t1" /></span>
                  <span className="t1 muted text-right">{followerCount(e)} followers</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden sm:block">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Call</TableHead><TableHead>Status</TableHead><TableHead>Token</TableHead>
              <TableHead className="hidden md:table-cell">Caller</TableHead>
              <TableHead className="r">Vault</TableHead>
              <TableHead className="r hidden sm:table-cell">Followers</TableHead>
              <TableHead className="r hidden lg:table-cell">Opened</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {numbered.map(({ e, n }) => (
                <TableRow key={e.address} className="row" tabIndex={0} onClick={() => router.push(`/call/?c=${e.address}`)} onKeyDown={(k) => k.key === "Enter" && router.push(`/call/?c=${e.address}`)}>
                  <TableCell><span className="num">#{n}</span> <span className="hash ink hidden sm:inline">{short(e.address, 4)}</span></TableCell>
                  <TableCell>{status(e, now)}</TableCell>
                  <TableCell><Redaction text={short(e.mint, 4)} open={e.state === "executed"} chars={9} className="hash" /></TableCell>
                  <TableCell className="hidden md:table-cell"><a className="hash muted textlink" style={{ color: "var(--muted)" }} href={explorerAddr(e.caller)} target="_blank" rel="noreferrer" onClick={(x) => x.stopPropagation()}>{short(e.caller)}</a></TableCell>
                  <TableCell className="r">{fmtSol(e.stake + e.followerLamports)}<span className="muted hidden sm:inline"> / {fmtSol(e.cap)}</span></TableCell>
                  <TableCell className="r hidden sm:table-cell">{e.state === "executed" && followerCount(e) === 0 && e.followerLamports > 0 ? <span className="muted">claimed</span> : followerCount(e)}</TableCell>
                  <TableCell className="r hidden lg:table-cell"><span className="muted">{fmtDate(e.openedAt)}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="card-h"><h2 className="t4">Recorded run, call #1</h2><Badge tone="filled">Filled</Badge></div>
            <ol className="grid">
              {record.map(([k, what, tx]) => (
                <li key={tx} className="grid grid-cols-[88px_minmax(0,1fr)] sm:grid-cols-[104px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 sm:px-6 py-3 rule-b last:border-b-0">
                  <span className="label">{k}</span>
                  <span className="t2">{what}</span>
                  <a className="hash t1 textlink col-start-2 sm:col-start-auto" href={explorerTx(tx)} target="_blank" rel="noreferrer">{short(tx, 5)}</a>
                </li>
              ))}
            </ol>
          </div>
          <div className="card">
            <div className="card-h"><h2 className="t4">How it pays</h2></div>
            <div className="card-b grid gap-4">
              <div className="grid grid-cols-3 gap-2">
                {[["1%", "fee on fill"], ["30%", "to caller"], ["70%", "to protocol"]].map(([v, l]) => (
                  <div key={l} className="panel p-3"><div className="hash t4 ink" style={{ fontWeight: 600 }}>{v}</div><div className="t1 muted mt-1">{l}</div></div>
                ))}
              </div>
              <p className="t2">Taken in the reveal transaction, set in the on-chain config. A lapsed call refunds in full and pays nothing.</p>
              <div className="flex items-center gap-2"><Badge tone="muted">Planned</Badge><span className="t1 muted">Caller subscription, not built</span></div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-h"><h2 className="t4">Who asked for it</h2><span className="t1 muted">{EVIDENCE.length} public posts</span></div>
          <ul className="grid sm:grid-cols-2">
            {EVIDENCE.map(([q, who, url, note]) => (
              <li key={url} className="px-4 sm:px-6 py-4 rule-b grid gap-1">
                <span className="t2 ink">{q}</span>
                <span className="t1 muted"><a className="textlink" href={url} target="_blank" rel="noreferrer">{who}</a>{note ? `, ${note}` : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
