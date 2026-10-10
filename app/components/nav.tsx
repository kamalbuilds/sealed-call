"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { WaxSeal } from "@/components/wax-seal";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

export function Nav() {
  const path = usePathname();
  const item = (href: string, label: string) => (
    <Link href={href} className="eyebrow hover:text-[var(--ink)]" style={{ color: path === href ? "var(--wax)" : undefined }}>
      {label}
    </Link>
  );
  return (
    <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <WaxSeal size={40} seed="nav" />
          <span className="display text-2xl">Sealed&nbsp;Call</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-7">
          {item("/", "The Ledger")}
          {item("/open", "Seal a call")}
          {item("/#how", "How it works")}
        </nav>
        <WalletMultiButton />
      </div>
      <div className="dbl-rule mt-5" />
      <div className="flex justify-between eyebrow py-2">
        <span>Solana devnet · program JBwR…gU4N</span>
        <span className="hidden sm:inline">One transaction · one price · no front-run</span>
      </div>
    </header>
  );
}
