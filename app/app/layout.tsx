import type { Metadata } from "next";
import { Bodoni_Moda, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";

const display = Bodoni_Moda({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"] });
const body = Source_Serif_4({ variable: "--font-body", subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "Sealed Call: the ledger of sealed memecoin calls",
  description: "A caller seals a token in a hash. Followers deposit blind. At reveal, one Solana transaction buys for everyone at one price.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
