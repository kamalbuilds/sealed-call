import type { Metadata } from "next";
import { LedgerView } from "@/components/ledger-view";

export const metadata: Metadata = { title: "Sealed Call: the ledger of sealed memecoin calls" };
export default function Page() { return <LedgerView />; }
