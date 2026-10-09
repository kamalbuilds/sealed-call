"use client";

import { Nav } from "@/components/nav";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { mapProgramError } from "@/lib/program-errors";
import { sendInstructions, explorerTx } from "@/lib/tx";
import { useSealedProgram } from "@/hooks/use-sealed-program";
import { fetchCall, depositIx, claimIx, withComputeBudget } from "@/lib/sealed-call-client";
import { PublicKey } from "@solana/web3.js";

interface CallData {
  address: string;
  caller: string;
  seal: string;
  stake: number;
  vaultCap: number;
  followers: number;
  revealDeadline: number;
  callerLock: number;
  revealed: boolean;
  fillPrice?: number;
  totalSwapped?: number;
}

export default function CallPage() {
  const { address } = useParams();
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const program = useSealedProgram();
  const [call, setCall] = useState<CallData | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [txLink, setTxLink] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address || Array.isArray(address) || !program || !connection) return;
    loadCallData();
  }, [address, program, connection]);

  async function loadCallData() {
    if (!address || Array.isArray(address)) return;
    try {
      const callPk = new PublicKey(address);
      const callData = await fetchCall(program, callPk);
      setCall({
        address: callPk.toBase58(),
        caller: callData.caller.toBase58(),
        seal: "",
        stake: callData.callerStakeLamports.toNumber() / 10 ** 9,
        vaultCap: callData.maxVaultLamports.toNumber() / 10 ** 9,
        followers: 0,
        revealDeadline: callData.revealDeadline.toNumber(),
        callerLock: callData.callerLockSecs.toNumber(),
        revealed: "executed" in callData.state,
      });
    } catch (err) {
      console.error("Failed to load call:", err);
    }
  }

  if (!address || Array.isArray(address)) {
    return <div>Invalid call address</div>;
  }

  const now = Date.now() / 1000;
  const timeToReveal = call ? Math.max(0, call.revealDeadline - now) : 0;
  const isRevealed = call?.revealed || false;
  const isExpired = timeToReveal === 0 && !isRevealed;

  async function handleDeposit() {
    if (!publicKey || !depositAmount || !connection || !signTransaction || !call) return;
    setLoading(true);
    setError("");
    setTxLink("");

    try {
      const amount = Math.floor(parseFloat(depositAmount) * 10 ** 9);
      const ix = await depositIx(program, publicKey, new PublicKey(call.address), amount);
      const sig = await sendInstructions(
        connection,
        { publicKey, signTransaction },
        withComputeBudget(500000, [ix])
      );
      setTxLink(explorerTx(sig, "devnet"));
      setDepositAmount("");
    } catch (err: any) {
      setError(mapProgramError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim() {
    if (!publicKey || !connection || !signTransaction || !call) return;
    setLoading(true);
    setError("");
    setTxLink("");

    try {
      const ix = await claimIx(program, publicKey, new PublicKey(call.address));
      const sig = await sendInstructions(
        connection,
        { publicKey, signTransaction },
        withComputeBudget(500000, [ix])
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
        <div className="card" style={{ background: "var(--color-surface)" }}>
          <div className="mb-8">
            <div className="label mb-2">CALL ADDRESS</div>
            <div
              className="text-sm font-mono"
              style={{ color: "var(--color-primary)" }}
            >
              {address}
            </div>
          </div>

          {!call ? (
            <div className="text-center py-8">
              <p style={{ color: "var(--color-text-secondary)" }}>
                Loading call data...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="label mb-2">STAKE</div>
                  <div style={{ color: "var(--color-primary)" }}>
                    {call.stake} SOL
                  </div>
                </div>
                <div>
                  <div className="label mb-2">VAULT CAP</div>
                  <div style={{ color: "var(--color-primary)" }}>
                    {call.vaultCap} SOL
                  </div>
                </div>
                <div>
                  <div className="label mb-2">FOLLOWERS</div>
                  <div>{call.followers}</div>
                </div>
                <div>
                  <div className="label mb-2">STATUS</div>
                  <div
                    style={{
                      color: isRevealed
                        ? "var(--color-primary)"
                        : "var(--color-secondary)",
                    }}
                  >
                    {isRevealed ? "REVEALED" : isExpired ? "EXPIRED" : "SEALED"}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
                {!isRevealed ? (
                  <>
                    <h2 className="label mb-4">DEPOSIT SOL</h2>
                    <div className="flex gap-3 mb-4">
                      <input
                        type="number"
                        placeholder="Amount in SOL"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="input flex-1"
                        disabled={loading}
                      />
                      <button
                        onClick={handleDeposit}
                        disabled={loading || !depositAmount}
                        className="btn-primary"
                      >
                        {loading ? "..." : "DEPOSIT"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="label mb-4">CLAIM TOKENS</h2>
                    <button
                      onClick={handleClaim}
                      disabled={loading}
                      className="btn-primary w-full"
                    >
                      {loading ? "..." : "CLAIM"}
                    </button>
                  </>
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
                  <div className="mt-4">
                    <a
                      href={txLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary w-full text-center"
                    >
                      VIEW TX
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
