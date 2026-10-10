import { useId } from "react";

/** Flat, one-colour seal stamp. `broken` draws the crack the reveal leaves behind. */
export function SealStamp({ size = 96, broken = false, className = "" }: { size?: number; broken?: boolean; className?: string }) {
  const arc = `arc${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`stamp-ring ${className}`} style={broken ? { color: "var(--ink)" } : undefined} role="img" aria-label={broken ? "seal broken" : "sealed"}>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
      <path id={arc} d="M 22 50 A 28 28 0 1 1 78 50" fill="none" />
      <text fontFamily="var(--font-body), serif" fontSize="8" letterSpacing="1.5" fill="currentColor">
        <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle">SEALED CALL</textPath>
      </text>
      <text x="50" y="68" textAnchor="middle" fontFamily="var(--font-display), serif" fontSize="30" fill="currentColor" fontStyle="italic">sc</text>
      {broken && <path d="M50 4 L45 30 L56 46 L44 62 L53 78 L49 96" fill="none" stroke="var(--paper)" strokeWidth="4" strokeLinejoin="bevel" />}
    </svg>
  );
}
