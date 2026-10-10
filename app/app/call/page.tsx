import type { Metadata } from "next";
import { Suspense } from "react";
import CallView from "./CallView";

export const metadata: Metadata = { title: "Sealed Call: a call, its deposits and its reveal" };
export default function Page() { return <Suspense fallback={null}><CallView /></Suspense>; }
