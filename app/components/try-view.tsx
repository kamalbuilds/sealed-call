"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Masthead } from "@/components/masthead";
import { useSealedProgram } from "@/hooks/use-sealed-program";
import { fetchCalls } from "@/lib/sealed-call-client";
import { type Entry, fromAccount, fmtSol, seedEntries } from "@/lib/ledger";
import { BurnerWalletName, loadBurner } from "@/lib/burner-wallet";
import { RECORDED_DEVNET_RUN } from "@/lib/recorded-run";
import { short } from "@/lib/tx";

const NEED = 0.012; // stake 0.006 SOL + call and position rent + fees, with margin

/** The judge path: a wallet, devnet SOL, a sealed call of your own, and its reveal, in about a minute. */
export function TryView() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const program = useSealedProgram();
  const [bal, setBal] = useState<number | null>(null);
  const [drop, setDrop] = useState("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState<Entry[] | null>(null);

  useEffect(() => {
    if (!publicKey) { setBal(null); return; }
    let alive = true;
    const read = () => connection.getBalance(publicKey, "confirmed").then((b) => alive && setBal(b / LAMPORTS_PER_SOL)).catch(() => {});
    read(); const t = setInterval(read, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [publicKey, connection]);

  useEffect(() => {
    const now = Date.now() / 1000;
    const live = (es: Entry[]) => es.filter((e) => e.state === "open" && e.revealDeadline > now);
    const read = () => fetchCalls(program).then((rows) => live(rows.map((r) => fromAccount(r.publicKey.toBase58(), r.account))));
    // the public devnet RPC rate-limits getProgramAccounts: retry once, then fall back to the ledger snapshot
    read().catch(() => new Promise((r) => setTimeout(r, 2500)).then(read)).then(setOpen).catch(() => setOpen(live(seedEntries())));
  }, [program]);

  // Selecting the burner in-session did not reliably connect (provider auto-connect race), so pick it
  // the same way a returning visitor has it: store the choice, create the key, and reload. autoConnect does the rest.
  const useBurner = () => {
    loadBurner();
    localStorage.setItem("walletName", JSON.stringify(BurnerWalletName));
    window.location.reload();
  };

  const airdrop = async () => {
    if (!publicKey) return;
    setDrop("Asking the devnet faucet");
    try {
      const sig = await connection.requestAirdrop(publicKey, 0.1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      setDrop("0.1 SOL arrived.");
    } catch { setDrop("The public RPC refused the airdrop (it rate-limits). Use the faucet link instead; it takes about 20 seconds."); }
  };
  const copy = async () => { if (publicKey) { await navigator.clipboard.writeText(publicKey.toBase58()); setCopied(true); setTimeout(() => setCopied(false), 1500); } };
  const funded = bal !== null && bal >= NEED;

  return (
    <div className="pb-24">
      <Masthead />
      <main className="frame mt-8 md:mt-12">
        <section className="col">
          <span className="chip chip-muted chip-plain">For judges, about 60 seconds</span>
          <h1 className="display t6 mt-3">Try it in 60 seconds</h1>
          <p className="t3 mt-2 muted" style={{ maxWidth: "40em" }}>Seal a call of your own, then break the seal. Every step below is a real devnet transaction signed by you; nothing is simulated.</p>

          <ol className="mt-8 grid gap-4">
            <li className="clause">
              <div className="clause-n">1</div>
              <div>
                <h2 className="t4">A devnet wallet</h2>
                <p className="mt-2">Phantom or Solflare switched to devnet works. Or use a throwaway wallet kept in this browser, no install.</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {!publicKey ? <>
                    <button className="btn btn-seal btn-lg" onClick={useBurner}>Use a burner wallet</button>
                    <button className="btn btn-line" onClick={() => setVisible(true)}>Connect Phantom or Solflare</button>
                  </> : <p>Connected: <span className="hash">{short(publicKey.toBase58())}</span> <button className="textlink t1" onClick={copy}>{copied ? "Copied" : "Copy address"}</button></p>}
                </div>
              </div>
            </li>

            <li className="clause">
              <div className="clause-n">2</div>
              <div>
                <h2 className="t4">About {NEED} devnet SOL</h2>
                <p className="mt-2">The call stakes 0.006 SOL; the rest is rent and fees.{bal !== null && <> You hold <span className="lining strong">{bal.toFixed(4)}</span> SOL{funded ? ", enough." : "."}</>}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <a className="btn btn-line" href="https://faucet.solana.com/" target="_blank" rel="noreferrer">Open the Solana faucet</a>
                  <button className="btn btn-line" disabled={!publicKey || funded} onClick={airdrop}>Request 0.1 SOL here</button>
                </div>
                <p className="help mt-2">{drop || "On the faucet, paste your address, pick devnet and 0.5 SOL."}</p>
              </div>
            </li>

            <li className="clause">
              <div className="clause-n">3</div>
              <div>
                <h2 className="t4">Seal a small call</h2>
                <p className="mt-2">The form is prefilled: the demo Meteora DAMM v2 pool, 0.006 SOL stake, 0.04 SOL cap, a 60-minute window. Press <span className="strong">Seal the call</span> and sign once. The token is hashed; only you hold the salt.</p>
                <div className="mt-4"><Link className={funded ? "btn btn-seal" : "btn"} href="/open/">Open the seal form</Link></div>
              </div>
            </li>

            <li className="clause">
              <div className="clause-n">4</div>
              <div>
                <h2 className="t4">Break the seal</h2>
                <ul className="mt-3 grid gap-2 t2">
                  <li className="panel px-3 py-2"><span className="strong">Reveal:</span> on your call page press Reveal. One transaction checks the hash and fills every row at one price.</li>
                  <li className="panel px-3 py-2"><span className="strong">Add a follower:</span> open the call link in a private window, use a second burner, deposit 0.005 SOL, then reveal.</li>
                  <li className="panel px-3 py-2"><span className="strong">Claim:</span> followers claim at once; the caller&rsquo;s tokens unlock after 24 h.</li>
                </ul>
              </div>
            </li>
          </ol>
        </section>

        <aside className="margin">
          <p className="t4 strong">No wallet at hand?</p>
          <p className="mt-2">Watch the recorded devnet call: three followers and the caller filled in one swap.</p>
          <Link className="btn btn-line mt-4" href={`/call/?c=${RECORDED_DEVNET_RUN.call}`}>See a reveal</Link>
          <p className="t4 strong mt-8 pt-6 rule-t">Join a live call as a follower</p>
          {open === null ? <p className="mt-2">Reading devnet.</p> : open.length === 0 ? <p className="mt-2">No call is taking deposits right now. Seal one in §3, or deposit from a second wallet into yours.</p> : (
            <ul className="mt-3 grid gap-2">{open.map((e) => <li key={e.address}><Link className="panel flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-[var(--surface-elevated)]" href={`/call/?c=${e.address}`}><span className="flex items-center gap-2"><span className="chip chip-open">Open</span><span className="hash t1 ink">{short(e.address)}</span></span><span className="hash t1">{fmtSol(e.stake + e.followerLamports)} / {fmtSol(e.cap)}</span></Link></li>)}</ul>
          )}
        </aside>
      </main>
    </div>
  );
}
