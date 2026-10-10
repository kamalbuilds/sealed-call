import { Suspense } from "react";
import CallView from "./CallView";

export default function Page() {
  return <Suspense fallback={null}><CallView /></Suspense>;
}
