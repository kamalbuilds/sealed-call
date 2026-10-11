import type { ReactNode } from "react";

/** Summary stat tile: large mono figure, small uppercase label, optional sub line. */
export function Metric({ value, unit, label, sub, accent = false }: { value: ReactNode; unit?: string; label: string; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className="metric">
      <div className={`metric-v ${accent ? "accent" : ""}`}>{value}{unit && <span className="metric-u">{unit}</span>}</div>
      <div className="label metric-l">{label}</div>
      {sub && <div className="t1 muted mt-1">{sub}</div>}
    </div>
  );
}
