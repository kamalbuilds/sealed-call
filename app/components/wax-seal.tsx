"use client";

/** Wax seal SVG. `cracked` splits it in two halves that fall away. */
export function WaxSeal({ size = 120, seed = "x", cracked = false, live = false, label = "SC" }: { size?: number; seed?: string; cracked?: boolean; live?: boolean; label?: string }) {
  // deterministic blob from seed
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pts: string[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const r = 46 + ((h >>> 8) % 7) - 2;
    const a = (i / n) * Math.PI * 2;
    pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
  }
  const blob = `M${pts.join(" L")} Z`;
  const id = `g-${seed.replace(/[^a-z0-9]/gi, "")}`;
  const body = (clip: string) => (
    <g clipPath={`url(#${clip})`}>
      <path d={blob} fill={`url(#${id})`} stroke="#5a0e0c" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="31" fill="none" stroke="#5a0e0c" strokeOpacity=".55" strokeWidth="2.2" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#e46a5e" strokeOpacity=".35" strokeWidth="1" />
      <text x="50" y="58" textAnchor="middle" fontFamily="var(--serif)" fontWeight="700" fontSize="24" fill="#5a0e0c" fillOpacity=".75" style={{ fontStyle: "italic" }}>{label}</text>
      <text x="50" y="57" textAnchor="middle" fontFamily="var(--serif)" fontWeight="700" fontSize="24" fill="#f19b8f" fillOpacity=".28" style={{ fontStyle: "italic" }}>{label}</text>
    </g>
  );
  return (
    <span className={`seal-wrap ${cracked ? "cracked" : ""} ${live ? "seal-live" : ""}`} style={{ width: size, height: size }}>
      <svg viewBox="-10 -10 120 120" width={size} height={size} style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id={id} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#df5246" />
            <stop offset="45%" stopColor="#a3201b" />
            <stop offset="100%" stopColor="#5e0f0d" />
          </radialGradient>
          <clipPath id={`${id}-l`}><path d="M-10,-10 L54,-10 L44,30 L58,52 L42,74 L52,110 L-10,110 Z" /></clipPath>
          <clipPath id={`${id}-r`}><path d="M54,-10 L110,-10 L110,110 L52,110 L42,74 L58,52 L44,30 Z" /></clipPath>
        </defs>
        <g className="seal-half seal-l">{body(`${id}-l`)}</g>
        <g className="seal-half seal-r">{body(`${id}-r`)}</g>
      </svg>
    </span>
  );
}
