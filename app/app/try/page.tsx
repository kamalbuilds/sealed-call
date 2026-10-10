import type { Metadata } from "next";
import { TryView } from "@/components/try-view";

export const metadata: Metadata = { title: "Sealed Call: try it in 60 seconds" };
export default function Page() { return <TryView />; }
