"use client";

import { useEffect, useState } from "react";

/** A black bar the width of the hidden text. When `open` flips, the text types in over 400ms. */
export function Redaction({ text, open, chars = 12, className = "" }: { text: string; open: boolean; chars?: number; className?: string }) {
  const [n, setN] = useState(open ? text.length : 0);
  useEffect(() => {
    if (!open) { setN(0); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(text.length); return; }
    setN(0);
    const step = 400 / Math.max(1, text.length);
    let i = 0;
    const t = setInterval(() => { i += 1; setN(i); if (i >= text.length) clearInterval(t); }, step);
    return () => clearInterval(t);
  }, [open, text]);
  if (!open) return <span className={`redact ${className}`} style={{ width: `${chars * 0.62}em` }} aria-label="token hidden until reveal" />;
  return (
    <span className={`typed ${className}`} aria-label={text}>
      {text.slice(0, n)}
      {n < text.length && <span className="redact" style={{ width: `${(text.length - n) * 0.6}em` }} />}
    </span>
  );
}
