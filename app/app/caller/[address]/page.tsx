"use client";

import { Nav } from "@/components/nav";
import { useConnection } from "@solana/wallet-adapter-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSealedProgram } from "@/hooks/use-sealed-program";
import { fetchCalls, callState } from "@/lib/sealed-call-client";
import { PublicKey } from "@solana/web3.js";

interface ExecutedCall {
  address: string;
  fillPrice: number;
  spotPrice: number;
  timestamp: number;
  followers: number;
  totalReturned: number;
}

export default function CallerPage() {
  const { address } = useParams();
  const { connection } = useConnection();
  const program = useSealedProgram();
  const [calls, setCalls] = useState<ExecutedCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPnl, setTotalPnl] = useState(0);

  useEffect(() => {
    if (!address || Array.isArray(address) || !program || !connection) return;
    fetchCallerRecord();
  }, [address, program, connection]);

  async function fetchCallerRecord() {
    if (!address || Array.isArray(address)) return;
    setLoading(true);
    try {
      const allCalls = await fetchCalls(program);
      const callerAddress = address;

      const callerCalls: ExecutedCall[] = allCalls
        .filter((c) => c.account.caller.toBase58() === callerAddress && callState(c.account) === "executed")
        .map((c) => ({
          address: c.publicKey.toBase58(),
          fillPrice: 0,
          spotPrice: 0,
          timestamp: c.account.callerStakeLamports.toNumber(),
          followers: 0,
          totalReturned: c.account.maxVaultLamports.toNumber() / 10 ** 9,
        }));

      setCalls(callerCalls);
      setTotalPnl(callerCalls.reduce((sum, c) => sum + c.totalReturned, 0));
    } catch (error) {
      console.error("Failed to fetch caller record:", error);
      setCalls([]);
      setTotalPnl(0);
    } finally {
      setLoading(false);
    }
  }

  if (!address || Array.isArray(address)) {
    return <div>Invalid caller address</div>;
  }

  return (
    <div style={{ background: "var(--color-canvas)", minHeight: "100vh" }}>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card" style={{ background: "var(--color-surface)" }}>
          <div className="mb-8">
            <div className="label mb-2">CALLER RECORD</div>
            <div
              className="text-sm font-mono"
              style={{ color: "var(--color-primary)" }}
            >
              {address}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div>
              <div className="label mb-2">EXECUTED CALLS</div>
              <div className="text-2xl">{calls.length}</div>
            </div>
            <div>
              <div className="label mb-2">TOTAL FOLLOWERS</div>
              <div className="text-2xl">{calls.reduce((a, b) => a + b.followers, 0)}</div>
            </div>
            <div>
              <div className="label mb-2">TOTAL PNL</div>
              <div
                className="text-2xl"
                style={{
                  color: totalPnl >= 0 ? "var(--color-primary)" : "var(--color-secondary)",
                }}
              >
                {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)} SOL
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p style={{ color: "var(--color-text-secondary)" }}>Loading calls...</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: "var(--color-text-secondary)" }}>No executed calls yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => (
                <div key={call.address} className="tile" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="label mb-2">FILL PRICE</div>
                      <div style={{ color: "var(--color-primary)" }}>
                        {call.fillPrice.toFixed(4)} tokens/SOL
                      </div>
                      <div className="text-xs mt-2" style={{ color: "var(--color-text-secondary)" }}>
                        {call.followers} followers
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="label mb-2">PRICE NOW</div>
                      <div>{call.spotPrice.toFixed(4)}</div>
                      <div
                        className="text-xs mt-2"
                        style={{
                          color: call.spotPrice > call.fillPrice
                            ? "var(--color-primary)"
                            : "var(--color-secondary)",
                        }}
                      >
                        {call.spotPrice > call.fillPrice ? "▲ UP" : "▼ DOWN"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
