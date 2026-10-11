// Status chip. Pattern from shadcn/ui Badge (https://ui.shadcn.com/docs/components/badge), tones mapped to call states.
import type { ReactNode } from "react";

export type Tone = "open" | "filled" | "lapsed" | "muted";
export function Badge({ tone, children, className = "" }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={`chip chip-${tone} ${className}`}>{children}</span>;
}
