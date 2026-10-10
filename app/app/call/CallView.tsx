"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Nav } from "@/components/nav";
import { WaxSeal } from "@/components/wax-seal";
import { useSealedProgram } from "@/hooks/use-sealed-program";
import { mapProgramError } from "@/lib/program-errors";
import { sendInstructions, explorerTx, explorerAddr, short, sol } from "@/lib/tx";
import { loadSeal, saveSeal, type SealData } from "@/lib/calls";
import { RECORDED_DEVNET_RUN } from "@/lib/recorded-run";
import {
  fetchCall, fetchPositions, fetchConfig, callState, depositIx, withdrawIx, claimIx, callerClaimIx, refundIx, expireIx,
  revealAndSwapIx, readPool, poolSides, spotOut, withComputeBudget, positionPda,
  type CallAccount, type PositionAccount, type ConfigAccount,
} from "@/lib/sealed-call-client";

type Pos = { publicKey: PublicKey; account: PositionAccount };
const unhex = (h: string) => Uint8Array.from(Buffer.from(h, "hex"));

export default function CallView() {
  const address = useSearchParams().get("c") ?? "";
  const callPk = useMemo(() => { try { return new PublicKey(address); } catch { return null; } }, [address]);
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const program = useSealedProgram();

  const [call, setCall] = useState<CallAccount | null>(null);
  const [missing, setMissing] = useState(false);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [cfg, setCfg] = useState<ConfigAccount | null>(null);
  const [decimals, setDecimals] = useState(6);
  const [seal, setSeal] = useState<SealData | null>(null);
  const [amount, setAmount] = useState("0.1");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lastSig, setLastSig] = useState<{ label: string; sig: string } | null>(null);
  const [revealTx, setRevealTx] = useState<string | null>(address === RECORDED_DEVNET_RUN.call ? RECORDED_DEVNET_RUN.revealTx : null);
  const [stage, setStage] = useState(0); // 0 sealed · 1 crack · 2 open · 3 ticker · 4 stamp · 5 fills
  const [now, setNow] = useState(() => Date.now() / 1000);

  useEffect(() => { const t = setInterval(() => setNow(Date.now() / 1000), 1000); return () => clearInterval(t); }, []);

  const refresh = useCallback(async () => {
    if (!callPk) return;
    try {
      const c = await fetchCall(program, callPk);
      setCall(c);
      fetchPositions(program, callPk).then(setPositions).catch(() => {});
      if (callState(c) === "executed") {
        const info = await connection.getParsedAccountInfo(c.revealedMint);
        const d = (info.value?.data as any)?.parsed?.info?.decimals;
        if (typeof d === "number") setDecimals(d);
      }
    } catch { setMissing(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callPk, connection]);

  useEffect(() => { void refresh(); fetchConfig(program).then(setCfg).catch(() => {}); setSeal(loadSeal(address)); const t = setInterval(refresh, 12000); return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const state = call ? callState(call) : null;
  const executed = state === "executed";
  const isCaller = !!(publicKey && call && call.caller.equals(publicKey));
  const myPos = publicKey ? positions.find((p) => p.account.follower.equals(publicKey)) : undefined;
  const deadline = call ? call.revealDeadline.toNumber() : 0;
  const pastDeadline = call ? now > deadline : false;

  // The reveal ceremony. Plays once when an executed call loads, again on demand.
  const play = useCallback(() => {
    setStage(0);
    [1, 2, 3, 4, 5].forEach((s, i) => setTimeout(() => setStage(s), 350 + i * 650));
  }, []);
  useEffect(() => { if (executed && stage === 0) play(); }, [executed, stage, play]);

  async function run(label: string, build: () => Promise<any[]>, units = 200_000) {
    if (!publicKey || !signTransaction) return;
    setBusy(label); setError("");
    try {
      const ixs = await build();
      const sig = await sendInstructions(connection, { publicKey, signTransaction }, withComputeBudget(units, ixs));
      setLastSig({ label, sig });
      await refresh();
      return sig;
    } catch (e) { setError(mapProgramError(e)); }
    finally { setBusy(null); }
  }

  async function reveal() {
    if (!call || !callPk || !seal || !publicKey) return;
    const sig = await run("reveal", async () => {
      const pool = await readPool(connection, new PublicKey(seal.pool));
      const { wsolIsA } = poolSides(pool);
      const total = BigInt(call.callerStakeLamports.toString()) + BigInt(call.followerLamports.toString());
      const net = (total * BigInt(10_000 - call.feeBps)) / 10_000n;
      const spot = spotOut(net, pool.sqrtPrice, wsolIsA);
      let minOut = (spot * BigInt(10_000 - call.maxImpactBps)) / 10_000n;
      if (minOut < 1n) minOut = 1n;
      return [await revealAndSwapIx(program, { caller: publicKey, call: callPk, mint: new PublicKey(seal.mint), pool: new PublicKey(seal.pool), salt: unhex(seal.salt), minimumAmountOut: minOut, poolVaults: pool })];
    }, 400_000);
    if (sig) { setRevealTx(sig); setStage(0); }
  }

  async function importSeal(f: File) {
    try { const d = JSON.parse(await f.text()) as SealData; if (d.call !== address) throw new Error("this seal file belongs to another call"); saveSeal(d); setSeal(d); }
    catch (e: any) { setError(e.message); }
  }

  // fill math: every lamport in the vault buys at the same price
  const totalIn = call ? sol(call.callerStakeLamports.toNumber() + call.followerLamports.toNumber()) : 0;
  const tokensOut = call ? Number(call.tokensOut.toString()) / 10 ** decimals : 0;
  const swapped = call ? sol(call.lamportsIn.toNumber()) : 0;
  const price = executed && tokensOut > 0 ? swapped / tokensOut : 0;
  const fills = useMemo(() => {
    if (!call) return [];
    const rows = [{ who: call.caller.toBase58(), lamports: call.callerStakeLamports.toNumber(), caller: true, claimed: call.callerClaimed }];
    positions.forEach((p) => rows.push({ who: p.account.follower.toBase58(), lamports: p.account.lamports.toNumber(), caller: false, claimed: p.account.claimed }));
    if (positions.length === 0 && address === RECORDED_DEVNET_RUN.call)
      RECORDED_DEVNET_RUN.followerFills.forEach((f) => rows.push({ who: f.who, lamports: f.lamports, caller: false, claimed: true }));
    return rows;
  }, [call, positions, address]);

  if (!callPk || missing) return <Shell><div className="sheet p-10 mt-10 text-center"><h1 className="display text-4xl">No such call</h1><p className="mono text-sm mt-3">{address}</p></div></Shell>;
  if (!call) return <Shell><div className="py-32 text-center eyebrow">unfolding the envelope…</div></Shell>;

  const hidden = !executed || stage < 3;
  const mintStr = call.revealedMint.toBase58();

  return (
    <Shell>
      <div className="flex flex-wrap items-baseline justify-between gap-3 pt-8">
        <div>
          <p className="eyebrow">Call <a className="link" href={explorerAddr(address)} target="_blank" rel="noreferrer">{short(address, 6)}</a> · by {short(call.caller.toBase58())}{isCaller && " (you)"}</p>
          <h1 className="display text-5xl sm:text-6xl mt-2">{executed ? "The seal is broken." : state === "expired" ? "Expired. Refunds open." : pastDeadline ? "Window closed." : "Sealed. Gathering."}</h1>
        </div>
        {!executed && !pastDeadline && <div className="text-right"><div className="eyebrow">reveal window closes in</div><Clock s={deadline - now} /></div>}
      </div>

      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-10 mt-8">
        {/* THE ENVELOPE */}
        <section>
          <div className={`relative mx-auto max-w-[620px] ${executed && stage >= 2 ? "opened" : ""}`} style={{ perspective: 1200 }}>
            <div className="h-[40px]" />
            <div className="relative h-[340px]">
              {/* letter */}
              <div className={`letter absolute left-[6%] right-[6%] top-[8%] h-[88%] sheet p-6 ${executed && stage >= 3 ? "z-[5]" : "z-[1]"}`}>
                <div className="flex justify-between eyebrow"><span>Order of fill</span><span>slot {executed ? call.executedSlot.toString() : "—"}</span></div>
                <div className="mt-5 eyebrow">Token</div>
                {hidden ? <div className="redact h-10 w-[80%] mt-2" /> :
                  <a href={explorerAddr(mintStr)} target="_blank" rel="noreferrer" className="ticker-in display block text-[34px] sm:text-[44px] mt-1 break-all leading-none">{short(mintStr, 6)}</a>}
                <div className="mt-6 grid grid-cols-3 gap-3 mono text-[12px]">
                  <Stat k="vault" v={`${totalIn.toFixed(3)} SOL`} />
                  <Stat k="swapped" v={executed && stage >= 3 ? `${swapped.toFixed(3)} SOL` : "—"} />
                  <Stat k="tokens" v={executed && stage >= 3 ? fmt(tokensOut) : "—"} />
                </div>
                {executed && stage >= 4 && (
                  <div className="absolute right-6 bottom-6 stamp stamp-in text-center">
                    <div className="text-[10px]">one price</div>
                    <div className="text-lg">{price.toExponential(3)}</div>
                    <div className="text-[10px]">SOL / token</div>
                  </div>
                )}
              </div>
              {/* envelope body */}
              <div className="absolute inset-0 z-[2] pointer-events-none" style={{ clipPath: "polygon(0 18%, 50% 62%, 100% 18%, 100% 100%, 0 100%)", background: "linear-gradient(180deg,#e2d4b3,#d6c49c)", border: "1px solid rgba(28,25,21,.25)", boxShadow: "0 30px 50px -30px rgba(60,40,10,.6)" }} />
              {/* flap */}
              <div className="flap absolute left-0 right-0 top-0 h-[62%] z-[3]" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", background: "linear-gradient(180deg,#d9c8a1,#cbb68a)" }} />
              {/* seal */}
              <div className={`absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 z-[4] ${busy === "reveal" ? "shaking" : ""}`}>
                <WaxSeal size={128} seed={address} cracked={executed && stage >= 1} live={!executed} />
              </div>
            </div>
          </div>

          {/* fills */}
          <div className="mt-10">
            <div className="flex items-end justify-between"><h2 className="display text-3xl">Fill register</h2>
              {executed && <button className="eyebrow underline" onClick={play}>replay the reveal</button>}</div>
            <div className="dbl-rule mt-2" />
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-3 eyebrow py-2 border-b border-[var(--rule)]"><span>Wallet</span><span>In (SOL)</span><span>Tokens</span><span className="text-right">Price</span></div>
            {fills.map((f, i) => {
              const share = totalIn > 0 ? sol(f.lamports) / totalIn : 0;
              const show = executed && stage >= 5;
              return (
                <div key={f.who} className={`grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-3 py-3 border-b border-[var(--rule)] mono text-[13px] ${show ? "rowfill" : ""}`} style={{ animationDelay: `${i * 140}ms` }}>
                  <span>{short(f.who)} {f.caller && <span className="chip text-[var(--wax)] ml-1">caller</span>}{publicKey?.toBase58() === f.who && <span className="chip text-[var(--brass)] ml-1">you</span>}</span>
                  <span>{sol(f.lamports).toFixed(3)}</span>
                  <span>{show ? `≈${fmt(tokensOut * share)}` : "—"}</span>
                  <span className="text-right" style={{ color: show ? "var(--wax)" : undefined }}>{show ? price.toExponential(3) : "sealed"}</span>
                </div>
              );
            })}
            {fills.length === 1 && <p className="eyebrow py-4">No followers yet. Share this page.</p>}
            {executed && revealTx && <p className="mt-4 mono text-xs">Every row above filled in one transaction: <a className="link" href={explorerTx(revealTx)} target="_blank" rel="noreferrer">{short(revealTx, 8)}</a></p>}
          </div>
        </section>

        {/* ACTIONS */}
        <aside className="space-y-6">
          <div className="sheet p-7">
            <div className="eyebrow">Terms, fixed on-chain at open</div>
            <div className="mt-4 space-y-2 mono text-[13px]">
              <Term k="caller stake" v={`${sol(call.callerStakeLamports.toNumber())} SOL`} />
              <Term k="vault cap" v={`${sol(call.maxVaultLamports.toNumber())} SOL`} />
              <Term k="followers" v={`${Math.max(call.followerCount, fills.length - 1)} · ${sol(call.followerLamports.toNumber()).toFixed(3)} SOL`} />
              <Term k="max price impact" v={`${call.maxImpactBps / 100}%`} />
              <Term k="fee" v={`${call.feeBps / 100}% (caller share ${call.callerFeeShareBps / 100}%)`} />
              <Term k="caller locked for" v={`${(call.callerLockSecs.toNumber() / 3600).toFixed(0)}h after fill`} />
              <Term k="seal" v={Buffer.from(call.commitment).toString("hex").slice(0, 16) + "…"} />
            </div>
          </div>

          <div className="sheet p-7 space-y-5">
            {!publicKey && <p className="text-[var(--ink-2)]">Connect a devnet wallet to take part.</p>}

            {/* follower: deposit/withdraw */}
            {publicKey && !isCaller && state === "open" && !pastDeadline && (
              <>
                <div className="eyebrow">Follow this call, blind</div>
                <label className="field"><span className="mono text-xs text-[var(--ink-3)]">SOL{cfg ? ` · min ${sol(cfg.minDepositLamports.toNumber())} · max ${sol(cfg.maxDepositLamports.toNumber())}` : ""}</span>
                  <input className="input text-2xl" type="number" step="0.05" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
                <div className="flex gap-2 flex-wrap">{["0.05", "0.1", "0.25", "0.5"].map((v) => <button key={v} className="chip hover:bg-[var(--paper-2)]" onClick={() => setAmount(v)}>{v}</button>)}</div>
                <button className="btn btn-wax w-full" disabled={!!busy} onClick={() => run("deposit", async () => [await depositIx(program, publicKey, callPk, BigInt(Math.round(parseFloat(amount) * 1e9)))])}>
                  {busy === "deposit" ? "Slipping it in…" : "Deposit into the sealed vault"}</button>
                {myPos && myPos.account.lamports.toNumber() > 0 && <>
                  <p className="mono text-xs">You're in for {sol(myPos.account.lamports.toNumber())} SOL.</p>
                  <button className="btn w-full" disabled={!!busy} onClick={() => run("withdraw", async () => [await withdrawIx(program, publicKey, callPk)])}>Withdraw before reveal</button></>}
              </>
            )}

            {/* caller: reveal */}
            {isCaller && state === "open" && !pastDeadline && (
              <>
                <div className="eyebrow">Caller · break the seal</div>
                {seal ? <>
                  <p className="text-sm text-[var(--ink-2)]">Seal found in this browser. Revealing swaps the whole vault — your stake and every follower's — in one transaction.</p>
                  <button className="btn btn-wax w-full" disabled={!!busy || call.followerCount === 0} onClick={reveal}>{busy === "reveal" ? "Breaking the seal…" : call.followerCount === 0 ? "Waiting for followers" : "Break the seal & fill everyone"}</button>
                </> : <>
                  <p className="text-sm text-[var(--ink-2)]">This browser doesn't hold the seal. Load your .seal.json file.</p>
                  <input type="file" accept=".json" className="mono text-xs" onChange={(e) => e.target.files?.[0] && importSeal(e.target.files[0])} />
                </>}
              </>
            )}

            {/* expiry path */}
            {state === "open" && pastDeadline && publicKey && (
              <>
                <div className="eyebrow">The caller never revealed</div>
                {myPos && !isCaller && <button className="btn btn-wax w-full" disabled={!!busy} onClick={() => run("refund", async () => [await refundIx(program, callPk, publicKey)])}>Take my SOL back</button>}
                <button className="btn w-full" disabled={!!busy} onClick={() => run("expire", async () => [await expireIx(program, callPk)])}>Mark expired</button>
              </>
            )}
            {state === "expired" && myPos && !myPos.account.claimed && publicKey && (
              <button className="btn btn-wax w-full" disabled={!!busy} onClick={() => run("refund", async () => [await refundIx(program, callPk, publicKey)])}>Take my SOL back</button>
            )}

            {/* claims */}
            {executed && publicKey && !isCaller && myPos && (
              myPos.account.claimed ? <p className="note-ok">Claimed. Tokens are in your wallet.</p> :
                <button className="btn btn-wax w-full" disabled={!!busy} onClick={() => run("claim", async () => [await claimIx(program, publicKey, callPk)])}>Claim my tokens</button>
            )}
            {executed && isCaller && (
              call.callerClaimed ? <p className="note-ok">Caller tokens claimed.</p> : (() => {
                const unlock = call.executedAt.toNumber() + call.callerLockSecs.toNumber();
                return now < unlock ? <><p className="eyebrow">Your tokens are locked</p><Clock s={unlock - now} /><p className="text-sm text-[var(--ink-2)]">No dumping on the people who followed you.</p></>
                  : <button className="btn btn-wax w-full" disabled={!!busy} onClick={() => run("caller claim", async () => [await callerClaimIx(program, publicKey, callPk)])}>Claim caller tokens</button>;
              })()
            )}
            {executed && publicKey && !isCaller && !myPos && <p className="text-sm text-[var(--ink-2)]">You weren't in this one. Next time, get in before the seal breaks.</p>}

            {error && <div className="note-err">{error}</div>}
            {lastSig && <div className="note-ok">{lastSig.label} confirmed · <a className="link" href={explorerTx(lastSig.sig)} target="_blank" rel="noreferrer">tx</a></div>}
            {publicKey && <p className="mono text-[11px] text-[var(--ink-3)]">Need devnet SOL? <a className="link" href="https://faucet.solana.com" target="_blank" rel="noreferrer">faucet.solana.com</a> · position PDA {short(positionPda(callPk, publicKey).toBase58())}</p>}
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen pb-24"><Nav /><main className="max-w-6xl mx-auto px-5 sm:px-8">{children}</main></div>;
}
function Stat({ k, v }: { k: string; v: string }) { return <div><div className="text-[var(--ink-3)] text-[10px] tracking-[.16em] uppercase">{k}</div><div className="mt-1">{v}</div></div>; }
function Term({ k, v }: { k: string; v: string }) { return <div className="flex justify-between gap-3 border-b border-dashed border-[var(--rule)] pb-2"><span className="text-[var(--ink-3)]">{k}</span><span className="text-right">{v}</span></div>; }
function Clock({ s }: { s: number }) {
  const t = Math.max(0, Math.floor(s));
  const p = (n: number) => String(n).padStart(2, "0");
  return <div className="display text-5xl tabular-nums">{p(Math.floor(t / 3600))}:{p(Math.floor((t % 3600) / 60))}:{p(t % 60)}</div>;
}
function fmt(n: number) { return n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(2)}K` : n.toFixed(2); }
