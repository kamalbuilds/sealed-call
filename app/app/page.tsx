"use client";

import { Nav } from "@/components/nav";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Call {
  address: string;
  caller: string;
  seal: string;
  stake: number;
  vaultCap: number;
  followers: number;
  revealDeadline: number;
  revealed: boolean;
  fillPrice?: number;
  timestamp: number;
}

export default function Home() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connection) return;
    fetchCalls();
    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, [connection]);

  async function fetchCalls() {
    setLoading(true);
    try {
      setCalls([]);
    } catch (error) {
      console.error("Failed to fetch calls:", error);
    } finally {
      setLoading(false);
    }
  }

  const now = Date.now() / 1000;

  return (
    <div style={{ background: "var(--color-canvas)", minHeight: "100vh" }}>
      <Nav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!publicKey ? (
          <div className="text-center py-16">
            <p className="label mb-4">Connect wallet to start</p>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Use Phantom or Solflare to join the sealed call stream
            </p>
          </div>
        ) : calls.length === 0 && !loading ? (
          <div className="text-center py-16">
            <p className="label mb-4">No calls yet</p>
            <p style={{ color: "var(--color-text-secondary)" }} className="mb-8">
              Be the first to open a call or wait for others to join
            </p>
            <Link href="/open" className="btn-primary">
              Open First Call
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const timeLeft = call.revealDeadline - now;
              const status = call.revealed ? "revealed" : "sealed";
              const isExpired = timeLeft < 0;

              return (
                <Link key={call.address} href={`/call/${call.address}`}>
                  <div
                    className={`tile cursor-pointer transition-all ${
                      status === "sealed" ? "tile.sealed" : "tile.revealed"
                    }`}
                    style={{
                      borderColor: call.revealed
                        ? "var(--color-primary)"
                        : "var(--color-secondary)",
                      background: call.revealed
                        ? "rgba(60, 255, 208, 0.05)"
                        : "rgba(82, 0, 255, 0.05)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="label mb-2">
                          {call.revealed ? "REVEALED" : "SEALED"}
                        </div>
                        {!call.revealed ? (
                          <>
                            <div
                              className="text-sm mb-2"
                              style={{ color: "var(--color-text)" }}
                            >
                              {call.seal.slice(0, 16)}...
                            </div>
                            <div className="text-xs text-gray-400">
                              Caller: {call.caller.slice(0, 8)}...
                            </div>
                          </>
                        ) : (
                          <>
                            <div
                              className="text-sm mb-2"
                              style={{ color: "var(--color-primary)" }}
                            >
                              {call.fillPrice?.toFixed(4) || "N/A"} tokens/SOL
                            </div>
                            <div className="text-xs text-gray-400">
                              {call.followers} followers
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="label">
                          {call.stake.toFixed(2)} SOL STAKE
                        </div>
                        <div className="timestamp mt-2">
                          {isExpired
                            ? "EXPIRED"
                            : `${Math.max(0, Math.floor(timeLeft / 3600))}h left`}
                        </div>
                      </div>
                    </div>
                    <div
                      className="mt-3"
                      style={{
                        height: "4px",
                        background: "var(--color-text-secondary)",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: "var(--color-primary)",
                          width: `${Math.min(100, (call.vaultCap / 10) * 100)}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
