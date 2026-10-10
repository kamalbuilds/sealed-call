"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Masthead } from "@/components/masthead";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { SealStamp } from "@/components/seal-stamp";
import { Redaction } from "@/components/redaction";
import { Ticker } from "@/components/ticker";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import seedJson from "@/lib/seed-calls.json";
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

const SUP: Record<string, string> = { "-": "\u207b", "0": "\u2070", "1": "\u00b9", "2": "\u00b2", "3": "\u00b3", "4": "\u2074", "5": "\u2075", "6": "\u2076", "7": "\u2077", "8": "\u2078", "9": "\u2079" };
function Sci({ x }: { x: number }) { const [m, e] = x.toExponential(3).split("e"); return <>{m}&thinsp;×&thinsp;10<sup style={{ fontSize: "0.6em", verticalAlign: "0.45em", lineHeight: 0 }}>{e.replace("+", "").replace("-", "\u2212")}</sup></>; }
function sci(x: number) { const [m, e] = x.toExponential(3).split("e"); return `${m} \u00d7 10${e.replace("+", "").split("").map((c) => SUP[c] ?? c).join("")}`; }

export default function CallView() {
  const address = useSearchParams().get("c") ?? "";
  const callPk = useMemo(() => { try { return new PublicKey(address); } catch { return null; } }, [address]);
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const program = useSealedProgram();
  const { setVisible } = useWalletModal();

  const seedCall = useMemo(() => {
    const raw = (seedJson.calls as any[]).find((c) => c.address === address)?.raw;
    try { return raw ? (program.coder.accounts.decode("call", Buffer.from(raw, "base64")) as CallAccount) : null; } catch { return null; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);
  const [call, setCall] = useState<CallAccount | null>(seedCall);
  const [snapshot, setSnapshot] = useState(!!seedCall);
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
      setCall(c); setSnapshot(false);
      fetchPositions(program, callPk).then(setPositions).catch(() => {});
      if (callState(c) === "executed") {
        const info = await connection.getParsedAccountInfo(c.revealedMint);
        const d = (info.value?.data as any)?.parsed?.info?.decimals;
        if (typeof d === "number") setDecimals(d);
      }
    } catch { if (!seedCall) setMissing(true); }
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
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setStage(6); return; }
    [[1, 200], [3, 500], [4, 1000], [5, 1400], [6, 2400]].forEach(([s, t]) => setTimeout(() => setStage(s), t));
  }, []);
  const played = useRef(false);
  useEffect(() => { if (executed && !played.current) { played.current = true; play(); } }, [executed, play]);

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
    if (sig) { setRevealTx(sig); played.current = false; }
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


  const lotNo = useMemo(() => { const i = (seedJson.calls as any[]).findIndex((c) => c.address === address); return i >= 0 ? i + 1 : null; }, [address]);

  if (!callPk || missing) return <Page><section className="col"><h1 className="t3">No call at this address.</h1><p className="hash mt-4 break-all">{address}</p></section></Page>;
  if (!call) return <Page><section className="col"><h1 className="display t4">Reading the call from devnet.</h1><p className="hash mt-4 muted break-all">{address}</p></section></Page>;

  const opened = executed && stage >= 3;
  const mintStr = call.revealedMint.toBase58();
  const isRecorded = address === RECORDED_DEVNET_RUN.call;
  const notes: { label: React.ReactNode; sig: string }[] = [];
  if (isRecorded) {
    notes.push({ label: "Sealed by the caller", sig: RECORDED_DEVNET_RUN.openTx });
    RECORDED_DEVNET_RUN.depositTxs.forEach((d, i) => notes.push({ label: `Deposit ${i + 1}`, sig: d }));
    notes.push({ label: "A reveal with the wrong salt, rejected on chain", sig: RECORDED_DEVNET_RUN.rejectedRevealTx });
  }
  if (executed && revealTx) notes.push({ label: "The reveal: one swap for every row", sig: revealTx });
  if (lastSig && lastSig.sig !== revealTx) notes.push({ label: `Your ${lastSig.label}`, sig: lastSig.sig });

  return (
    <Page>
      <section className="span" style={{ maxWidth: 1032 }}>
        <p className="t2 muted">
          {lotNo ? <span className="display t3" style={{ color: "var(--ink)" }}>№&thinsp;{lotNo}</span> : null}
          {lotNo ? " · " : ""}Call <a className="textlink hash" href={explorerAddr(address)} target="_blank" rel="noreferrer">{short(address, 6)}</a>, by <span className="hash">{short(call.caller.toBase58())}</span>{isCaller && " (you)"}
        </p>
        {snapshot && <p className="t1 muted mt-2">Shown from the devnet snapshot in this build until the RPC answers.</p>}
        <div className="mt-4 flex items-center justify-between gap-6">
        <h1 className="display t4">
          {executed ? "The seal is broken." : state === "expired" ? "Lapsed. Refunds are open." : pastDeadline ? "The window has closed." : "Sealed, and taking deposits."}
        </h1>
          <SealStamp size={150} broken={executed && stage >= 1} className={`shrink-0 hidden sm:block ${executed && stage >= 1 ? "strike" : ""}`} />
        </div>
        {executed && stage >= 4 && (
          <p className={stage < 6 ? "rowin mt-6" : "mt-6"}><span className="display t5 red lining" style={{ whiteSpace: "nowrap" }}><Sci x={price} /></span> <span className="t2 muted">SOL a token, the one price every row paid.</span></p>
        )}

        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 ink-t ink-b">
          <Cell k="Caller stake" v={`${sol(call.callerStakeLamports.toNumber())} SOL`} />
          <Cell k="Vault cap" v={`${sol(call.maxVaultLamports.toNumber())} SOL`} />
          <Cell k="Followers" v={`${Math.max(call.followerCount, fills.length - 1)}`} />
          <Cell k="Worst impact" v={`${call.maxImpactBps / 100}%`} />
          <Cell k="Fee" v={`${call.feeBps / 100}%, ${call.callerFeeShareBps / 100}% to caller`} />
          <Cell k="Caller lock" v={`${(call.callerLockSecs.toNumber() / 3600).toFixed(0)} h after the fill`} />
        </dl>

        {/* the entry: the token as a redaction bar that types itself in */}
        <div className="ink-b py-6">
          <div className="t1 muted">Token</div>
          <div className="hash hash-long mt-2" style={{ fontSize: "var(--t2)", wordBreak: "normal" }}>
            <Redaction text={executed ? mintStr.replace(/(.{4})/g, "$1 ").trim() : ""} open={opened} chars={30} />
          </div>
          <p className="t3 mt-6" style={{ maxWidth: "34em" }}>
            {executed && stage >= 4 ? (
              <>The vault held <span className="lining">{totalIn.toFixed(3)}</span> SOL. The {call.feeBps / 100}% fee, <span className="lining">{(totalIn - swapped).toFixed(4)}</span> SOL, came out first, and <span className="lining">{swapped.toFixed(4)}</span> SOL went through the pool in one swap for <span className="lining"><Ticker value={tokensOut} format={fmt} /></span> tokens, split pro rata in the register below.</>
            ) : (
              <>The vault holds <span className="lining">{totalIn.toFixed(3)}</span> SOL. The swap, the tokens out and the one price stay sealed until the caller reveals.</>
            )}
          </p>
        </div>

        {/* fill register */}
        <div className="mt-12 flex items-baseline justify-between gap-4">
          <h2 className="display t4">Fill register</h2>
          {executed && <button className="textlink t1" onClick={play}>Replay the reveal</button>}
        </div>
        <div className="mt-4">
          <Table>
            <TableHeader><TableRow><TableHead>Wallet</TableHead><TableHead className="r">In, SOL</TableHead><TableHead className="r">Share</TableHead><TableHead className="r hidden sm:table-cell">Tokens</TableHead></TableRow></TableHeader>
            <TableBody>
              {fills.map((f, i) => {
                const share = totalIn > 0 ? sol(f.lamports) / totalIn : 0;
                const show = executed && stage >= 5;
                return (
                  <TableRow key={f.who} className={show && stage < 6 ? "rowin" : ""} style={{ animationDelay: `${i * 90}ms` }}>
                    <TableCell><span className="hash">{short(f.who)}</span> <span className="t1 muted">{f.caller ? "caller" : ""}{publicKey?.toBase58() === f.who ? (f.caller ? ", you" : "you") : ""}</span><div className="t1 muted sm:hidden lining">{show ? `${fmt(tokensOut * share)} tokens` : "tokens sealed"}</div></TableCell>
                    <TableCell className="r lining">{sol(f.lamports).toFixed(3)}</TableCell>
                    <TableCell className="r lining">{(share * 100).toFixed(1)}%</TableCell>
                    <TableCell className="r lining hidden sm:table-cell">{show ? fmt(tokensOut * share) : <span className="redact" style={{ width: "4em" }} />}</TableCell>
                    
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {executed && stage >= 5 && <p className="mt-3 t1">Every row paid <span className="lining" style={{ whiteSpace: "nowrap" }}><Sci x={price} /></span> SOL a token{revealTx ? <>, in transaction <a className="textlink hash" href={explorerTx(revealTx)} target="_blank" rel="noreferrer">{short(revealTx, 5)}</a></> : null}.</p>}
        {fills.length === 1 && <p className="mt-4 t1 muted">The caller is alone in the vault so far. Send this page to the people who follow your calls.</p>}

        {/* actions */}
        <div className="mt-12 heavy-t pt-6 grid gap-4">
          {!publicKey && <><p>Connect a devnet wallet to deposit, reveal or claim.</p><div><button className="btn btn-seal" onClick={() => setVisible(true)}>Connect a wallet</button></div></>}

          {publicKey && !isCaller && state === "open" && !pastDeadline && (
            <>
              <h2 className="display t3">Follow this call without seeing the token</h2>
              <div className="field">
                <label htmlFor="amt">Deposit, SOL{cfg ? ` (min ${sol(cfg.minDepositLamports.toNumber())}, max ${sol(cfg.maxDepositLamports.toNumber())})` : ""}</label>
                <input id="amt" className="input" type="number" inputMode="decimal" step="0.005" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="flex gap-4 flex-wrap items-center">
                <button className="btn btn-seal" disabled={!!busy} onClick={() => run("deposit", async () => [await depositIx(program, publicKey, callPk, BigInt(Math.round(parseFloat(amount) * 1e9)))])}>{busy === "deposit" ? "Depositing" : "Deposit"}</button>
                {myPos && myPos.account.lamports.toNumber() > 0 && <button className="btn btn-line" disabled={!!busy} onClick={() => run("withdraw", async () => [await withdrawIx(program, publicKey, callPk)])}>Withdraw {sol(myPos.account.lamports.toNumber())} SOL</button>}
              </div>
            </>
          )}

          {isCaller && state === "open" && !pastDeadline && (
            <>
              <h2 className="display t3">Break the seal</h2>
              {seal ? <>
                <p className="muted">The seal is in this browser. Revealing swaps the whole vault, your stake and every deposit, in one transaction.</p>
                <div><button className="btn btn-seal" disabled={!!busy || call.followerCount === 0} onClick={reveal}>{busy === "reveal" ? "Revealing" : call.followerCount === 0 ? "Waiting for a follower" : "Reveal and fill everyone"}</button></div>
              </> : <>
                <p className="muted">This browser does not hold the seal. Load the .seal.json you downloaded.</p>
                <input type="file" accept=".json,application/json" className="t1" onChange={(e) => e.target.files?.[0] && importSeal(e.target.files[0])} />
              </>}
            </>
          )}

          {state === "open" && pastDeadline && publicKey && (
            <>
              <h2 className="display t3">The caller did not reveal in time</h2>
              <div className="flex gap-4 flex-wrap">
                {myPos && !isCaller && <button className="btn btn-seal" disabled={!!busy} onClick={() => run("refund", async () => [await refundIx(program, callPk, publicKey)])}>Take my SOL back</button>}
                <button className="btn btn-line" disabled={!!busy} onClick={() => run("expire", async () => [await expireIx(program, callPk)])}>Mark the call lapsed</button>
              </div>
            </>
          )}
          {state === "expired" && myPos && !myPos.account.claimed && publicKey && (
            <div><button className="btn btn-seal" disabled={!!busy} onClick={() => run("refund", async () => [await refundIx(program, callPk, publicKey)])}>Take my SOL back</button></div>
          )}

          {executed && publicKey && !isCaller && myPos && (myPos.account.claimed
            ? <p>Claimed. The tokens are in your wallet.</p>
            : <div><button className="btn btn-seal" disabled={!!busy} onClick={() => run("claim", async () => [await claimIx(program, publicKey, callPk)])}>Claim my tokens</button></div>)}
          {executed && isCaller && (call.callerClaimed ? <p>Your tokens are claimed.</p> : (() => {
            const unlock = call.executedAt.toNumber() + call.callerLockSecs.toNumber();
            return now < unlock
              ? <p>Your tokens unlock in <span className="lining strong">{hms(unlock - now)}</span>. Until then you cannot sell into the people who followed you.</p>
              : <div><button className="btn btn-seal" disabled={!!busy} onClick={() => run("caller claim", async () => [await callerClaimIx(program, publicKey, callPk)])}>Claim the caller&rsquo;s tokens</button></div>;
          })())}
          {executed && publicKey && !isCaller && !myPos && <p className="muted">You were not in this call. The next one is on the ledger.</p>}

          {error && <p className="err" role="alert">{error}</p>}
          {publicKey && <p className="t1 muted">Devnet SOL: <a className="textlink" href="https://faucet.solana.com" target="_blank" rel="noreferrer">faucet.solana.com</a>.</p>}
        </div>
      </section>

      {/* marginalia */}
      <section className="span mt-16 heavy-t pt-6 grid gap-10 md:grid-cols-3 t1">
        <div>
        <SealStamp size={64} broken={executed && stage >= 1} className="sm:hidden" />
        <p className="mt-2">{executed ? `Broken at slot ${call.executedSlot.toString()}.` : pastDeadline ? "Never broken." : `Breaks by ${hms(deadline - now)} from now, or lapses.`}</p>
        <p className="mt-4 muted">The commitment on chain</p>
        <p className="mt-1 hash hash-long" style={{ wordBreak: "normal" }}>{Buffer.from(call.commitment).toString("hex").replace(/(.{8})/g, "$1 ").trim()}</p>
        </div>
        {notes.length > 0 && (
          <div className="md:col-span-2"><h2 className="t2 strong">Notes</h2><ol className="mt-3 grid gap-2 md:grid-cols-2 gap-x-8">
            {notes.map((n, i) => (
              <li key={n.sig}><sup className="fn">{i + 1}</sup> {n.label}, <a className="textlink hash" href={explorerTx(n.sig)} target="_blank" rel="noreferrer">{short(n.sig, 5)}</a>.</li>
            ))}
          </ol></div>
        )}
      </section>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="pb-24"><Masthead /><main className="frame mt-12">{children}</main></div>;
}
function Cell({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="py-3 pr-4 rule-b lg:border-b-0"><dt className="t1 muted">{k}</dt><dd className="m-0 mt-1 lining">{v}</dd></div>;
}
function hms(s: number) {
  const t = Math.max(0, Math.floor(s)); const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`;
}
function fmt(n: number) { return n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(2)}K` : n.toFixed(2); }
