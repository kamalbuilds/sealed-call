"use client";
// Confirmation step modelled on a swap review sheet: plain summary, simulated outcome, then sign. Dialog pattern from shadcn/ui Dialog (https://ui.shadcn.com/docs/components/dialog).
import { useCallback, useState, type ReactNode } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { TransactionInstruction } from "@solana/web3.js";
import { prepareTx, sendPrepared, explorerTx, short, type Prepared } from "@/lib/tx";
import { mapProgramError } from "@/lib/program-errors";
import { useSolPrice, usd } from "@/lib/price";

export type Review = { title: string; lines: ReactNode[]; terms?: ReactNode };
export type TxState = { label: string; phase: "pending" | "confirmed" | "failed"; sig?: string; error?: string } | null;

export function useTxFlow(onDone?: (label: string, sig: string) => void | Promise<void>) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [review, setReview] = useState<(Review & { label: string; prep: Prepared | null; error: string }) | null>(null);
  const [status, setStatus] = useState<TxState>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const start = useCallback(async (label: string, build: () => Promise<TransactionInstruction[]>, r: Review) => {
    if (!publicKey) return;
    setBusy(label); setReview({ ...r, label, prep: null, error: "" });
    try {
      const prep = await prepareTx(connection, publicKey, await build());
      setReview({ ...r, label, prep, error: prep.simError ? mapProgramError(prep.simError) : "" });
    } catch (e) { setReview({ ...r, label, prep: null, error: mapProgramError(e) }); }
    finally { setBusy(null); }
  }, [connection, publicKey]);

  const confirm = useCallback(async () => {
    if (!review?.prep || !publicKey || !signTransaction) return;
    const { label, prep } = review; setReview(null); setBusy(label);
    setStatus({ label, phase: "pending" });
    try {
      const sig = await sendPrepared(connection, { publicKey, signTransaction }, prep, (s) => setStatus({ label, phase: "pending", sig: s }));
      setStatus({ label, phase: "confirmed", sig });
      await onDone?.(label, sig);
    } catch (e: any) { setStatus({ label, phase: "failed", sig: e?.signature, error: mapProgramError(e) }); }
    finally { setBusy(null); }
  }, [review, connection, publicKey, signTransaction, onDone]);

  return { start, confirm, cancel: () => setReview(null), review, status, busy, setStatus };
}

export function ReviewSheet({ flow }: { flow: ReturnType<typeof useTxFlow> }) {
  const price = useSolPrice();
  const r = flow.review; if (!r) return null;
  const p = r.prep; const fee = p ? p.feeLamports / 1e9 : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} role="dialog" aria-modal="true" aria-labelledby="review-title">
      <div className="card w-full max-w-md">
        <div className="card-h"><h2 id="review-title" className="t4">{r.title}</h2><span className="chip chip-devnet">DEVNET</span></div>
        <div className="card-b grid gap-4">
          <ul className="grid gap-2 t3 ink">{r.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          <div className="panel p-4 grid gap-2 t2">
            <div className="label">Simulated outcome</div>
            {!p && !r.error && <p className="muted">Simulating on devnet…</p>}
            {p && !r.error && <>
              <Row k="Simulation" v={<span className="chip chip-filled">Succeeds</span>} />
              <Row k="Network fee" v={<span className="hash">{fee.toFixed(6)} SOL</span>} />
              {p.balanceDelta !== null && <Row k="Your SOL balance" v={<span className="hash">{p.balanceDelta >= 0 ? "+" : ""}{(p.balanceDelta / 1e9).toFixed(6)} SOL{usd(Math.abs(p.balanceDelta) / 1e9, price) ? ` (${usd(Math.abs(p.balanceDelta) / 1e9, price)})` : ""}</span>} />}
              {p.units !== null && <Row k="Compute" v={<span className="hash">{p.units.toLocaleString("en-US")} CU</span>} />}
            </>}
            {r.error && <p className="err" role="alert">{r.error}</p>}
          </div>
          {r.terms && <p className="t2 body">{r.terms}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-line btn-lg" onClick={flow.cancel}>Cancel</button>
            <button className="btn btn-seal btn-lg" disabled={!p || !!r.error} onClick={flow.confirm}>Sign and send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: ReactNode }) { return <div className="flex items-center justify-between gap-4"><span className="body">{k}</span>{v}</div>; }

export function TxStatus({ s }: { s: TxState }) {
  if (!s) return null;
  const tone = s.phase === "confirmed" ? "chip-filled" : s.phase === "failed" ? "chip-lapsed" : "chip-open";
  const word = s.phase === "confirmed" ? "Confirmed" : s.phase === "failed" ? "Failed" : "Pending";
  return (
    <div className="panel p-4 grid gap-2" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3"><span className="t2 ink">Your {s.label}</span><span className={`chip ${tone}`}>{word}</span></div>
      {s.sig ? <a className="textlink hash t2" href={explorerTx(s.sig)} target="_blank" rel="noreferrer">{short(s.sig)} on Solana Explorer</a> : <span className="t2 body">Waiting for the wallet signature.</span>}
      {s.error && <p className="err" role="alert">{s.error}</p>}
    </div>
  );
}
