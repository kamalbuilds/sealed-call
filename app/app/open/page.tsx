"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Nav } from "@/components/nav";
import { WaxSeal } from "@/components/wax-seal";
import { useSealedProgram } from "@/hooks/use-sealed-program";
import { mapProgramError } from "@/lib/program-errors";
import { sendInstructions, explorerTx, short } from "@/lib/tx";
import { saveSeal, downloadSeal, type SealData } from "@/lib/calls";
import {
  openCallIx, withComputeBudget, randomSalt, readPool, poolSides, callPda, commitment, fetchConfig,
  type PoolInfo, type ConfigAccount,
} from "@/lib/sealed-call-client";

const DEMO_POOL = "9mwSK2b1CL6knpy5A8SK2uv4UJfQ2P7FyKkbYiC19j8K";
const hex = (b: Uint8Array) => Buffer.from(b).toString("hex");

export default function OpenPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const program = useSealedProgram();

  const [cfg, setCfg] = useState<ConfigAccount | null>(null);
  const [poolAddress, setPoolAddress] = useState(DEMO_POOL);
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [stake, setStake] = useState("0.2");
  const [cap, setCap] = useState("2");
  const [windowMin, setWindowMin] = useState("60");
  const [lockHours, setLockHours] = useState("24");
  const [impact, setImpact] = useState("5");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sealed, setSealed] = useState<{ data: SealData; sig: string; hash: string } | null>(null);
  const [pressing, setPressing] = useState(false);

  useEffect(() => { fetchConfig(program).then(setCfg).catch(() => setCfg(null)); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  useEffect(() => {
    setPool(null);
    let pk: PublicKey;
    try { pk = new PublicKey(poolAddress.trim()); } catch { return; }
    readPool(connection, pk).then(setPool).catch((e) => setError(mapProgramError(e)));
  }, [poolAddress, connection]);

  const mint = useMemo(() => { try { return pool ? poolSides(pool).mint : null; } catch { return null; } }, [pool]);
  const minStakePct = cfg ? cfg.minCallerStakeBps / 100 : null;

  async function seal() {
    if (!publicKey || !signTransaction || !pool || !mint) return;
    setBusy(true); setError(""); setPressing(true);
    try {
      const callId = BigInt(Date.now());
      const call = callPda(publicKey, callId);
      const salt = randomSalt();
      const c = commitment(call, mint, pool.address, salt);
      const data: SealData = { call: call.toBase58(), callId: callId.toString(), mint: mint.toBase58(), pool: pool.address.toBase58(), salt: hex(salt), createdAt: Date.now() };
      saveSeal(data); // before signing: never lose a salt for a call that lands
      const ix = await openCallIx(program, {
        caller: publicKey, callId, commitment: c,
        revealWindowSecs: Math.round(parseFloat(windowMin) * 60),
        callerLockSecs: Math.round(parseFloat(lockHours) * 3600),
        maxVaultLamports: BigInt(Math.round(parseFloat(cap) * 1e9)),
        maxImpactBps: Math.round(parseFloat(impact) * 100),
        callerStakeLamports: BigInt(Math.round(parseFloat(stake) * 1e9)),
      });
      const sig = await sendInstructions(connection, { publicKey, signTransaction }, withComputeBudget(200_000, [ix]));
      setSealed({ data, sig, hash: hex(c) });
    } catch (e) {
      setError(mapProgramError(e));
    } finally {
      setBusy(false); setTimeout(() => setPressing(false), 600);
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <Nav />
      <main className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 grid lg:grid-cols-[1.2fr_1fr] gap-12">
        <section>
          <p className="eyebrow mb-3">Caller · instrument of commitment</p>
          <h1 className="display text-6xl">Seal a call</h1>
          <p className="mt-4 text-[var(--ink-2)] text-lg max-w-lg">Name the pool. Only its hash goes on-chain; the token stays in this browser until you break the seal.</p>

          <div className="sheet p-8 mt-8 space-y-7">
            <label className="field">
              <span className="eyebrow">Meteora DAMM v2 pool (wSOL pair)</span>
              <input className="input" value={poolAddress} onChange={(e) => { setError(""); setPoolAddress(e.target.value); }} placeholder="pool address" />
              <span className="mt-2 mono text-xs text-[var(--ink-3)] flex justify-between">
                <span>{pool && mint ? <>reads as token <b className="text-[var(--ink)]">{short(mint.toBase58(), 6)}</b> — hidden after sealing</> : "reading pool…"}</span>
                {poolAddress !== DEMO_POOL && <button className="underline" onClick={() => setPoolAddress(DEMO_POOL)}>use demo pool</button>}
              </span>
            </label>

            <div className="grid sm:grid-cols-2 gap-7">
              <label className="field"><span className="eyebrow">Your stake (SOL)</span><input className="input" type="number" step="0.05" value={stake} onChange={(e) => setStake(e.target.value)} />
                <span className="mt-1 mono text-[11px] text-[var(--ink-3)]">{minStakePct !== null ? `≥ ${minStakePct}% of the cap` : ""} · buys with followers</span></label>
              <label className="field"><span className="eyebrow">Vault cap (SOL)</span><input className="input" type="number" step="0.5" value={cap} onChange={(e) => setCap(e.target.value)} />
                <span className="mt-1 mono text-[11px] text-[var(--ink-3)]">{cfg ? `max ${(cfg.maxCallLamports.toNumber() / 1e9).toFixed(1)} SOL per call` : ""}</span></label>
              <label className="field"><span className="eyebrow">Reveal window (minutes)</span><input className="input" type="number" value={windowMin} onChange={(e) => setWindowMin(e.target.value)} />
                <span className="mt-1 mono text-[11px] text-[var(--ink-3)]">miss it and followers refund</span></label>
              <label className="field"><span className="eyebrow">Your lock after fill (hours)</span><input className="input" type="number" value={lockHours} onChange={(e) => setLockHours(e.target.value)} />
                <span className="mt-1 mono text-[11px] text-[var(--ink-3)]">{cfg ? `min ${(cfg.minCallerLockSecs.toNumber() / 3600).toFixed(0)}h` : ""} · no dumping on followers</span></label>
              <label className="field"><span className="eyebrow">Max price impact (%)</span><input className="input" type="number" step="0.5" value={impact} onChange={(e) => setImpact(e.target.value)} />
                <span className="mt-1 mono text-[11px] text-[var(--ink-3)]">{cfg ? `ceiling ${cfg.maxPriceImpactBps / 100}%` : ""} · fill worse than this reverts</span></label>
              <div className="field"><span className="eyebrow">Fee, fixed at open</span><div className="mono text-sm py-[10px]">{cfg ? `${cfg.feeBps / 100}% · caller earns ${cfg.callerFeeShareBps / 100}% of it` : "…"}</div></div>
            </div>

            {error && <div className="note-err">{error}</div>}
            <div className="flex items-center gap-4 pt-2">
              <button className="btn btn-wax" disabled={!publicKey || !pool || !mint || busy || !!sealed} onClick={seal}>
                {!publicKey ? "Connect a wallet first" : busy ? "Pressing the wax…" : sealed ? "Sealed" : "Press the seal"}
              </button>
              <span className="mono text-xs text-[var(--ink-3)]">1 signature · devnet</span>
            </div>
          </div>
        </section>

        <aside className="lg:pt-24">
          <div className="sheet p-8 text-center">
            <div className="eyebrow">What the world sees</div>
            <div className={`my-8 flex justify-center ${pressing ? "shaking" : ""}`}><WaxSeal size={170} seed={sealed?.data.call ?? "preview"} live={!!sealed} /></div>
            <div className="text-left space-y-3 mono text-[13px]">
              <Row k="token" v={<span className="redact inline-block w-40 h-4" />} />
              <Row k="seal hash" v={sealed ? `${sealed.hash.slice(0, 20)}…` : "sha256(call‖mint‖pool‖salt)"} />
              <Row k="stake" v={`${stake} SOL`} />
              <Row k="cap" v={`${cap} SOL`} />
              <Row k="window" v={`${windowMin} min`} />
            </div>
            {sealed && (
              <div className="mt-7 text-left space-y-4">
                <div className="note-ok">Sealed on devnet. <a className="link" href={explorerTx(sealed.sig)} target="_blank" rel="noreferrer">open tx</a></div>
                <p className="text-sm text-[var(--ink-2)]">Your salt is saved in this browser. Download a copy: without it you cannot reveal, and followers will refund.</p>
                <div className="flex flex-wrap gap-3">
                  <button className="btn" onClick={() => downloadSeal(sealed.data)}>Download seal</button>
                  <Link className="btn btn-ink" href={`/call?c=${sealed.data.call}`}>Go to the call</Link>
                </div>
                <p className="mono text-xs text-[var(--ink-3)] break-all">share: {typeof window !== "undefined" ? `${location.origin}/call?c=${sealed.data.call}` : ""}</p>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3 border-b border-dashed border-[var(--rule)] pb-2"><span className="text-[var(--ink-3)]">{k}</span><span className="text-right">{v}</span></div>;
}
