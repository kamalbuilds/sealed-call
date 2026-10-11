"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { Masthead } from "@/components/masthead";
import { Redaction } from "@/components/redaction";
import { useRef } from "react";
import { useTxFlow, ReviewSheet, TxStatus } from "@/components/tx-flow";
import { useSolPrice, usd, priceStamp, localTime } from "@/lib/price";
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

  const [editPool, setEditPool] = useState(false);
  const [cfg, setCfg] = useState<ConfigAccount | null>(null);
  const [poolAddress, setPoolAddress] = useState(DEMO_POOL);
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [poolErr, setPoolErr] = useState("");
  const [stake, setStake] = useState("0.006");
  const [cap, setCap] = useState("0.04");
  const [windowMin, setWindowMin] = useState("60");
  const [lockHours, setLockHours] = useState("24");
  const [impact, setImpact] = useState("25");
  
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

  const solUsd = useSolPrice();
  const pendingSeal = useRef<{ data: SealData; hash: string } | null>(null);
  const flow = useTxFlow(async (_l, sig) => { if (pendingSeal.current) setSealed({ ...pendingSeal.current, sig }); });
  const u = (x: number) => (usd(x, solUsd) ? ` (${usd(x, solUsd)})` : "");
  const deadlineGuess = Date.now() / 1000 + (parseFloat(windowMin) || 0) * 60;

  async function seal() {
    if (!publicKey || !signTransaction || !pool || !mint) return;
    setError("");
    const st = parseFloat(stake) || 0;
    await flow.start("seal", async () => {
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
      pendingSeal.current = { data, hash: hex(c) };
      return withComputeBudget(200_000, [ix]);
    }, {
      title: "Review sealed call",
      lines: [<>You stake <b className="hash">{st} SOL</b>{u(st)} and buy alongside your followers at the one fill price.</>, <>Only a hash of the pool goes on chain. The token stays in this browser.</>, <>Vault cap <b className="hash">{cap} SOL</b>{u(parseFloat(cap) || 0)}.</>],
      terms: <>Reveal by about <b className="ink">{localTime(deadlineGuess)}</b> or every follower can refund in full and your stake returns after they do. Your tokens lock for {lockHours} h after the fill.</>,
    });
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

  const cta = !publicKey ? <button className="btn btn-seal btn-lg w-full sm:w-auto" onClick={() => setVisible(true)}>Connect a wallet</button>
    : sealed ? <span className="chip chip-filled">Sealed on devnet</span> : <button className="btn btn-seal btn-lg w-full sm:w-auto" disabled={!pool || !mint || !!flow.busy} onClick={seal}>{flow.busy ? "Preparing" : "Seal the call"}</button>;

  return (
    <div className="pb-24">
      <Masthead />
      <main className="frame mt-8 md:mt-12">
        <section className="col">
          <span className="chip chip-muted">Devnet, one signature</span>
          <h1 className="display t6 mt-3">Seal a call</h1>
          <p className="t3 mt-2 muted" style={{ maxWidth: "40em" }}>Name the pool. Only its hash goes on chain, and the token stays in this browser until you reveal.</p>

          <div className="mt-8 grid gap-4">
            <div className="clause">
              <div className="clause-n">1</div>
              <div className="field">
                <label htmlFor={editPool ? "pool" : undefined}>The pool: Meteora DAMM v2, paired with wSOL</label>
                {editPool ? <input id="pool" className="input hashin" autoFocus value={poolAddress} onChange={(e) => { setError(""); setPoolAddress(e.target.value); }} onBlur={() => setEditPool(false)} disabled={!!sealed} spellCheck={false} />
                  : <div className="input hashin flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><span id="pool" className="hash">{short(poolAddress)}</span>{!sealed && <button className="textlink t1" onClick={() => setEditPool(true)}>Change the pool</button>}</div>}
                <span className="help">
                  {poolErr ? <span className="red">{poolErr}</span> : pool && mint ? <>Reads as token <span className="hash">{short(mint.toBase58())}</span>. Hidden once sealed.</> : "Reading the pool from devnet."}
                  {poolAddress !== DEMO_POOL && !sealed && <> <button className="textlink" onClick={() => setPoolAddress(DEMO_POOL)}>Use the demo pool</button></>}
                </span>
              </div>
            </div>
            <div className="clause">
              <div className="clause-n">2</div>
              <div className="grid sm:grid-cols-2 gap-8">
                {f("stake", "Your stake, SOL", stake, setStake, cfg ? `At least ${cfg.minCallerStakeBps / 100}% of the cap. It buys with the followers.` : "It buys with the followers.", "any", true)}
                {f("cap", "Vault cap, SOL", cap, setCap, cfg ? `Up to ${(cfg.maxCallLamports.toNumber() / 1e9).toFixed(2)} SOL per call.` : "", "any", true)}
              </div>
            </div>
            <div className="clause">
              <div className="clause-n">3</div>
              <div>
                <p className="label">Terms, fixed before anyone pays in</p>
                <div className="mt-2">
                  {term("window", "Reveal window, minutes", windowMin, setWindowMin, "Miss it and every follower can refund.", "1")}
                  {term("lock", "Your lock after the fill, hours", lockHours, setLockHours, cfg ? `Minimum ${(cfg.minCallerLockSecs.toNumber() / 3600).toFixed(0)} h. You cannot sell into your followers.` : "You cannot sell into your followers.", "1")}
                  {term("impact", "Worst price impact, %", impact, setImpact, cfg ? `Ceiling ${cfg.maxPriceImpactBps / 100}%. A worse fill reverts.` : "A worse fill reverts.")}
                  <div className="term"><span>Fee</span><span className="lining">{cfg ? `${cfg.feeBps / 100}%` : "1%"}</span><span className="help">{cfg ? `${cfg.callerFeeShareBps / 100}% of it goes to the caller.` : ""}</span></div>
                </div>
              </div>
            </div>
            {error && <p className="err" role="alert">{error}</p>}
            <TxStatus s={flow.status} />
            <p className="t2 body lg:hidden">You stake <span className="hash ink">{parseFloat(stake) || 0} SOL</span>{u(parseFloat(stake) || 0)}. Followers can refund in full if you do not reveal by about <span className="ink">{localTime(deadlineGuess)}</span>.</p>
            <div className="flex items-center gap-4 flex-wrap lg:hidden">
              {cta}
              <span className="t1 muted">One signature on devnet.</span>
            </div>
          </div>
        </section>

        <aside className="margin lg:sticky lg:top-6">
          {!sealed && (
            <div className="hidden lg:grid gap-3 mb-6 pb-6 rule-b">
              <p className="label">Summary</p>
              <dl className="grid grid-cols-2 gap-2">
                {[["Stake", `${stake} SOL`], ["Cap", `${cap} SOL`], ["Window", `${windowMin} min`], ["Lock", `${lockHours} h`]].map(([k, v]) => (
                  <div key={k} className="panel px-3 py-2"><dt className="t1 muted">{k}</dt><dd className="m-0 hash ink">{v}</dd></div>
                ))}
              </dl>
              <p className="t2 body">You stake <span className="hash ink">{parseFloat(stake) || 0} SOL</span>{u(parseFloat(stake) || 0)}. Followers can refund in full if you do not reveal by about <span className="ink">{localTime(deadlineGuess)}</span>.</p>
              {solUsd ? <p className="t1 muted">{priceStamp(solUsd)}</p> : null}
              <div className="[&>*]:w-full">{cta}</div>
            </div>
          )}
          <p className="label">What the chain will hold</p>
          <dl className="mt-2 grid gap-2 t1">
            <div className="panel px-3 py-2"><dt className="t1 muted">Token</dt><dd className="m-0"><Redaction text="" open={false} chars={10} /></dd></div>
            <div className="panel px-3 py-2"><dt className="t1 muted">Seal</dt><dd className={sealed ? "m-0 hash t1 break-all" : "m-0 hash t1"} style={{ whiteSpace: "normal" }}>{sealed ? sealed.hash : "sha256(call, mint, pool, salt)"}</dd></div>
          </dl>
          {sealed && (
            <div className="mt-6 grid gap-3">
              <p><span className="chip chip-filled">Sealed</span> in <a className="textlink hash" href={explorerTx(sealed.sig)} target="_blank" rel="noreferrer">{short(sealed.sig)}</a>.</p>
              <p>The salt is saved in this browser. Keep a copy: without it you cannot reveal and your followers will refund.</p>
              <button className="btn btn-line" onClick={() => downloadSeal(sealed.data)}>Download the seal</button>
              <Link className="btn btn-seal" href={`/call/?c=${sealed.data.call}`}>Open the call</Link>
            </div>
          )}
        </aside>
      </main>
      <ReviewSheet flow={flow} />
    </div>
  );
}
