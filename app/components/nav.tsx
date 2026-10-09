"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Nav() {
  return (
    <nav className="border-b" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-lg font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            SEALED CALL
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="label" style={{ color: "var(--color-text)" }}>
              STREAM
            </Link>
            <Link href="/open" className="label" style={{ color: "var(--color-text)" }}>
              OPEN
            </Link>
          </div>
        </div>
        <div style={{ marginBottom: "-10px" }}>
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );
}
