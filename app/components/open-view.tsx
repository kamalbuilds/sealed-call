"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { Masthead } from "@/components/masthead";
import { SealStamp } from "@/components/seal-stamp";
import { Redaction } from "@/components/redaction";
import { useSealedProgram } from "@/hooks/use-sealed-program";
import { mapProgramError } from "@/lib/program-errors";
import { sendInstructions, explorerTx, short } from "@/lib/tx";
import { saveSeal, downloadSeal, type SealData } from "@/lib/calls";
import { openCallIx, withComputeBudget, randomSalt, readPool, poolSides, callPda, commitment, fetchConfig, type PoolInfo, type ConfigAccount } from "@/lib/sealed-call-client";

const DEMO_POOL = "9mwSK2b1CL6knpy5A8SK2uv4UJfQ2P7FyKkbYiC19j8K";
const hex = (b: Uint8Array) => Buffer.from(b).toString("hex");

export function OpenView() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const program = useSealedProgram();

  const [cfg, setCfg] = useState<ConfigAccount | null>(null);
  const [poolAddress, setPoolAddress] = useState(DEMO_POOL);
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [poolErr, setPoolErr] = useState("");
  const [stake, setStake] = useState("0.006");
  const [cap, setCap] = useState("0.04");
  const [windowMin, setWindowMin] = useState("60");
  const [lockHours, setLockHours] = useState("24");
  const [impact, setImpact] = useState("25");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sealed, setSealed] = useState<{ data: SealData; sig: string; hash: string } | null>(null);

  useEffect(() => { fetchConfig(program).then(setCfg).catch(() => setCfg(null)); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);
  useEffect(() => {
    setPool(null); setPoolErr("");
    let pk: PublicKey;
    try { pk = new PublicKey(poolAddress.trim()); } catch { setPoolErr("Not a valid address."); return; }
    readPool(connection, pk).then(setPool).catch((e) => setPoolErr(mapProgramError(e)));
  }, [poolAddress, connection]);

  const mint = useMemo(() => { try { return pool ? poolSides(pool).mint : null; } catch { return null; } }, [pool]);

  async function seal() {
    if (!publicKey || !signTransaction || !pool || !mint) return;
    setBusy(true); setError("");
    try {
      const callId = BigInt(Date.now());
      const call = callPda(publicKey, callId);
      const salt = randomSalt();
      const c = commitment(call, mint, pool.address, salt);
      const data: SealData = { call: call.toBase58(), callId: callId.toString(), mint: mint.toBase58(), pool: pool.address.toBase58(), salt: hex(salt), createdAt: Date.now() };
      saveSeal(data); // stored before signing, so a landed call never loses its salt
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
    } catch (e) { setError(mapProgramError(e)); }
    finally { setBusy(false); }
  }

  const term = (id: string, label: string, value: string, set: (v: string) => void, help: string, step = "any") => (
    <div className="term">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" type="number" inputMode="decimal" step={step} value={value} onChange={(e) => set(e.target.value)} disabled={!!sealed} />
      <span className="help">{help}</span>
    </div>
  );
  const f = (id: string, label: string, value: string, set: (v: string) => void, help: string, step = "any", big = false) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className={big ? "input big" : "input"} type="number" inputMode="decimal" step={step} value={value} onChange={(e) => set(e.target.value)} disabled={!!sealed} />
      <span className="help">{help}</span>
    </div>
  );

  return (
    <div className="pb-24">
      <Masthead />
      <main className="frame mt-12">
        <section className="col">
          <p className="t1 muted">Deed of a sealed call, devnet</p>
          <h1 className="display t4 mt-2">Seal a call</h1>
          <p className="t2 mt-4 muted" style={{ maxWidth: "36em" }}>Name the pool. Only its hash goes on chain, and the token stays in this browser until you reveal.</p>

          <div className="mt-10 grid gap-10">
            <div className="clause">
              <div className="clause-n">§&thinsp;1</div>
              <div className="field">
                <label htmlFor="pool">The pool: Meteora DAMM v2, paired with wSOL</label>
                <input id="pool" className="input hashin" value={poolAddress} onChange={(e) => { setError(""); setPoolAddress(e.target.value); }} disabled={!!sealed} spellCheck={false} />
                <span className="help">
                  {poolErr ? <span className="red">{poolErr}</span> : pool && mint ? <>Reads as token <span className="hash">{short(mint.toBase58(), 6)}</span>. Hidden once sealed.</> : "Reading the pool from devnet."}
                  {poolAddress !== DEMO_POOL && !sealed && <> <button className="textlink" onClick={() => setPoolAddress(DEMO_POOL)}>Use the demo pool</button></>}
                </span>
              </div>
            </div>
            <div className="clause">
              <div className="clause-n">§&thinsp;2</div>
              <div className="grid sm:grid-cols-2 gap-8">
                {f("stake", "Your stake, SOL", stake, setStake, cfg ? `At least ${cfg.minCallerStakeBps / 100}% of the cap. It buys with the followers.` : "It buys with the followers.", "any", true)}
                {f("cap", "Vault cap, SOL", cap, setCap, cfg ? `Up to ${(cfg.maxCallLamports.toNumber() / 1e9).toFixed(2)} SOL per call.` : "", "any", true)}
              </div>
            </div>
            <div className="clause">
              <div className="clause-n">§&thinsp;3</div>
              <div>
                <p className="t1 muted">Terms, fixed before anyone pays in</p>
                <div className="mt-2">
                  {term("window", "Reveal window, minutes", windowMin, setWindowMin, "Miss it and every follower can refund.", "1")}
                  {term("lock", "Your lock after the fill, hours", lockHours, setLockHours, cfg ? `Minimum ${(cfg.minCallerLockSecs.toNumber() / 3600).toFixed(0)} h. You cannot sell into your followers.` : "You cannot sell into your followers.", "1")}
                  {term("impact", "Worst price impact, %", impact, setImpact, cfg ? `Ceiling ${cfg.maxPriceImpactBps / 100}%. A worse fill reverts.` : "A worse fill reverts.")}
                  <div className="term"><span>Fee</span><span className="lining">{cfg ? `${cfg.feeBps / 100}%` : "1%"}</span><span className="help">{cfg ? `${cfg.callerFeeShareBps / 100}% of it goes to the caller.` : ""}</span></div>
                </div>
              </div>
            </div>
            {error && <p className="err" role="alert">{error}</p>}
            <div className="flex items-center gap-4 flex-wrap sm:pl-16">
              {!publicKey ? <button className="btn btn-seal" onClick={() => setVisible(true)}>Connect a wallet</button>
                : <button className="btn btn-seal" disabled={!pool || !mint || busy || !!sealed} onClick={seal}>{busy ? "Sealing" : sealed ? "Sealed" : "Seal the call"}</button>}
              <span className="t1 muted">One signature on devnet.</span>
            </div>
          </div>
        </section>

        <aside className="margin md:pt-24">
          <SealStamp size={72} className={sealed ? "strike" : ""} />
          <p className="mt-4 t1">What the chain will hold:</p>
          <dl className="mt-2 grid gap-2 t1">
            <div className="rule-b pb-2"><dt>Token</dt><dd className="m-0"><Redaction text="" open={false} chars={10} /></dd></div>
            <div className="rule-b pb-2"><dt>Seal</dt><dd className="m-0 hash break-all">{sealed ? sealed.hash : "sha256(call, mint, pool, salt)"}</dd></div>
          </dl>
          {sealed && (
            <div className="mt-6 grid gap-3">
              <p><sup className="fn">1</sup> Sealed in <a className="textlink hash" href={explorerTx(sealed.sig)} target="_blank" rel="noreferrer">{short(sealed.sig, 6)}</a>.</p>
              <p>The salt is saved in this browser. Keep a copy: without it you cannot reveal and your followers will refund.</p>
              <button className="btn btn-line" onClick={() => downloadSeal(sealed.data)}>Download the seal</button>
              <Link className="btn" href={`/call/?c=${sealed.data.call}`}>Open the call</Link>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
