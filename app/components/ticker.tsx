// Count-up pattern from 21st.dev dillionverma/number-ticker (https://21st.dev/r/dillionverma/number-ticker), re-done with rAF, no motion lib.
"use client";

import { useEffect, useState } from "react";

/** Serif number ticker: counts from 0 to `value` once, 600ms ease-out. Immediate under reduced motion. */
export function Ticker({ value, format, run = true }: { value: number; format: (n: number) => string; run?: boolean }) {
  const [v, setV] = useState(run ? 0 : value);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(value); return; }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / 600));
      setV(value * (1 - Math.pow(1 - k, 4)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, run]);
  return <span className="fig">{format(v)}</span>;
}
