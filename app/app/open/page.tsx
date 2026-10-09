"use client";

import { Nav } from "@/components/nav";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { mapProgramError } from "@/lib/program-errors";
import { sendInstructions, explorerTx } from "@/lib/tx";
import { saveSeal } from "@/lib/calls";
import { useSealedProgram } from "@/hooks/use-sealed-program";
import {
  openCallIx,
  withComputeBudget,
  randomSalt,
  readPool,
  callPda,
  commitment,
  type PoolInfo,
} from "@/lib/sealed-call-client";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";

export default function OpenPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const program = useSealedProgram();

  const [poolAddress, setPoolAddress] = useState("");
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [stake, setStake] = useState("1");
  const [vaultCap, setVaultCap] = useState("10");
  const [revealWindow, setRevealWindow] = useState("86400");
  const [callerLock, setCallerLock] = useState("604800");
  const [maxImpact, setMaxImpact] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sealPreview, setSealPreview] = useState("");
  const [salt, setSalt] = useState<Uint8Array | null>(null);
  const [txLink, setTxLink] = useState("");

  async function handleReadPool() {
    if (!poolAddress || !connection) return;
    setLoading(true);
    setError("");

    try {
      const poolPk = new PublicKey(poolAddress);
      const poolData = await readPool(connection, poolPk);
      setPool(poolData);
    } catch (err: any) {
      setError(mapProgramError(err));
      setPool(null);
    } finally {
      setLoading(false);
    }
  }

  async function generateSeal() {
    if (!pool || !publicKey) return;

    try {
      const newSalt = randomSalt();
      setSalt(newSalt);

      const callPdaKey = callPda(publicKey, 0);
      const cmmt = commitment(callPdaKey, pool.tokenAMint, pool.address, newSalt);

      setSealPreview(Buffer.from(cmmt).toString("hex").slice(0, 16) + "...");

      saveSeal(callPdaKey.toBase58(), {
        callId: callPdaKey.toBase58(),
        mint: pool.tokenAMint.toBase58(),
        pool: poolAddress,
        salt: Buffer.from(newSalt).toString("hex"),
        call: callPdaKey.toBase58(),
      });
    } catch (err: any) {
      setError("Failed to generate seal: " + err.message);
    }
  }

  async function handleOpenCall() {
    if (!publicKey || !pool || !connection || !signTransaction || !salt) return;
    setLoading(true);
    setError("");
    setTxLink("");

    try {
      const stakeAmount = Math.floor(parseFloat(stake) * 10 ** 9);
      const capAmount = Math.floor(parseFloat(vaultCap) * 10 ** 9);
      const revealWindowSec = parseInt(revealWindow);
      const callerLockSec = parseInt(callerLock);
      const maxImpactBps = Math.floor(parseFloat(maxImpact) * 100);

      const callPdaKey = callPda(publicKey, 0);
      const cmmt = commitment(callPdaKey, pool.tokenAMint, pool.address, salt);

      const ixs = [
        await openCallIx(program, {
          caller: publicKey,
          callId: 0,
          commitment: cmmt,
          revealWindowSecs: revealWindowSec,
          callerLockSecs: callerLockSec,
          maxVaultLamports: capAmount,
          maxImpactBps: maxImpactBps,
          callerStakeLamports: stakeAmount,
        }),
      ];

      const sig = await sendInstructions(
        connection,
        { publicKey, signTransaction },
        withComputeBudget(500000, ixs)
      );
      setTxLink(explorerTx(sig, "devnet"));
    } catch (err: any) {
      setError(mapProgramError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "var(--color-canvas)", minHeight: "100vh" }}>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "var(--color-primary)" }}>
          OPEN CALL
        </h1>

        <div className="card" style={{ background: "var(--color-surface)" }}>
          <div className="mb-6">
            <label className="label mb-2 block">POOL ADDRESS (METEORA DAMM V2)</label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Pool address"
                value={poolAddress}
                onChange={(e) => setPoolAddress(e.target.value)}
                className="input flex-1"
                disabled={loading}
              />
              <button
                onClick={handleReadPool}
                disabled={loading || !poolAddress}
                className="btn-secondary"
              >
                {loading ? "..." : "READ"}
              </button>
            </div>
          </div>

          {pool && (
            <>
              <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="label mb-2">TOKEN MINT</div>
                    <div
                      className="text-sm font-mono"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {pool.tokenAMint.toBase58().slice(0, 12)}...
                    </div>
                  </div>
                  <div>
                    <div className="label mb-2">SPOT PRICE</div>
                    <div>{(Number(pool.sqrtPrice) / Math.pow(2, 64)).toFixed(6)} SOL</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="label mb-2 block">CALLER STAKE (SOL)</label>
                    <input
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      className="input w-full"
                      disabled={loading}
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="label mb-2 block">VAULT CAP (SOL)</label>
                    <input
                      type="number"
                      value={vaultCap}
                      onChange={(e) => setVaultCap(e.target.value)}
                      className="input w-full"
                      disabled={loading}
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="label mb-2 block">REVEAL WINDOW (SECONDS)</label>
                    <input
                      type="number"
                      value={revealWindow}
                      onChange={(e) => setRevealWindow(e.target.value)}
                      className="input w-full"
                      disabled={loading}
                    />
                    <div className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      {Math.floor(parseInt(revealWindow) / 86400)} days
                    </div>
                  </div>

                  <div>
                    <label className="label mb-2 block">CALLER LOCK (SECONDS)</label>
                    <input
                      type="number"
                      value={callerLock}
                      onChange={(e) => setCallerLock(e.target.value)}
                      className="input w-full"
                      disabled={loading}
                    />
                    <div className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      {Math.floor(parseInt(callerLock) / 86400)} days
                    </div>
                  </div>

                  <div>
                    <label className="label mb-2 block">MAX PRICE IMPACT (%)</label>
                    <input
                      type="number"
                      value={maxImpact}
                      onChange={(e) => setMaxImpact(e.target.value)}
                      className="input w-full"
                      disabled={loading}
                      step="0.1"
                    />
                  </div>

                  {!sealPreview && (
                    <button
                      onClick={generateSeal}
                      disabled={loading}
                      className="btn-secondary w-full"
                    >
                      {loading ? "..." : "GENERATE SEAL"}
                    </button>
                  )}
                </div>

                {sealPreview && (
                  <div
                    className="mt-6 p-4 rounded"
                    style={{
                      background: "rgba(60, 255, 208, 0.1)",
                      border: "1px solid var(--color-primary)",
                    }}
                  >
                    <div className="label mb-2">SEAL PREVIEW</div>
                    <div
                      className="font-mono text-sm"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {sealPreview}
                    </div>
                    <div
                      className="text-xs mt-2"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Save this seal in localStorage or download the seal file to reveal later
                    </div>
                  </div>
                )}

                {error && (
                  <div
                    className="mt-4 p-3 rounded text-sm"
                    style={{
                      background: "rgba(82, 0, 255, 0.1)",
                      color: "var(--color-secondary)",
                    }}
                  >
                    {error}
                  </div>
                )}

                {txLink && (
                  <div className="mt-4 flex gap-3">
                    <a
                      href={txLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex-1 text-center"
                    >
                      VIEW TX
                    </a>
                    <Link href="/" className="btn-primary flex-1 text-center">
                      BACK TO STREAM
                    </Link>
                  </div>
                )}

                {!txLink && sealPreview && (
                  <button
                    onClick={handleOpenCall}
                    disabled={loading || !publicKey}
                    className="btn-primary w-full mt-6"
                  >
                    {loading ? "..." : publicKey ? "OPEN CALL" : "CONNECT WALLET"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
