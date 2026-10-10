"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const WalletMultiButton = dynamic(async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton, { ssr: false });

const edition = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Newspaper masthead: title on its own line, the edition line under a heavy rule. */
export function Masthead() {
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} className="textlink" aria-current={path === href ? "page" : undefined} style={path === href ? { textDecorationColor: "var(--ink)" } : undefined}>{label}</Link>
  );
  return (
    <header className="frame pt-8">
      <div className="span flex items-end justify-between gap-4 flex-wrap">
        <Link href="/" className="display t4 no-underline">Sealed Call</Link>
        <div className="flex items-center gap-6 t1">
          {link("/", "Ledger")}
          {link("/open/", "Seal a call")}
          {link("/try/", "Try it in 60s")}
          <WalletMultiButton />
        </div>
      </div>
      <div className="span heavy-t mt-4" />
      <div className="span flex justify-between gap-4 t1 muted py-2 rule-b">
        <span>Devnet edition, {edition.format(new Date())}</span>
        <span className="hidden sm:inline">Program <span className="hash">JBwReCk6…gU4N</span></span>
      </div>
    </header>
  );
}
