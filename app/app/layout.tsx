import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"] });
const plex = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Sealed Call — one call, one transaction, one price",
  description: "A memecoin caller seals a token. Followers deposit blind. At reveal, everyone buys in the same Solana transaction at the same price.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plex.variable}`}>
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
