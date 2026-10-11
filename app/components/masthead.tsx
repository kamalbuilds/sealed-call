"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const WalletMultiButton = dynamic(async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton, { ssr: false });

/** App header bar: wordmark, nav, network chip, wallet. */
export function Masthead() {
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} className="navlink" aria-current={path === href ? "page" : undefined}>{label}</Link>
  );
  return (
    <header className="rule-b" style={{ background: "var(--surface)" }}>
      <div className="shell flex items-center justify-between gap-4 h-16">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Sealed Call home">
            <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ background: "var(--primary)", color: "var(--on-primary)", fontWeight: 700, fontSize: 12 }}>SC</span>
            <span className="t3 ink" style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>Sealed Call</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {link("/", "Ledger")}
            {link("/open/", "Seal a call")}
            {link("/try/", "Try it in 60s")}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip chip-muted">Devnet</span>
          <WalletMultiButton />
        </div>
      </div>
      <nav className="shell flex md:hidden items-center gap-1 pb-2 overflow-x-auto">
        {link("/", "Ledger")}
        {link("/open/", "Seal a call")}
        {link("/try/", "Try it in 60s")}
      </nav>
    </header>
  );
}
