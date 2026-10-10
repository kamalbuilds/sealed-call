/** Commit → deposit → reveal, as a ruled three-step register. */
export function Timeline({ step, labels }: { step: 0 | 1 | 2 | 3; labels?: [string, string, string] }) {
  const names = ["Commit", "Deposit", "Reveal"];
  const notes = labels ?? ["hash on chain", "followers in blind", "one swap, one price"];
  return (
    <ol className="grid grid-cols-3 ink-t" aria-label="call progress">
      {names.map((n, i) => {
        const done = step > i, current = step === i;
        return (
          <li key={n} className="pt-2 pr-4" style={{ borderTop: done || current ? "3px solid var(--ink)" : "3px solid transparent", marginTop: -2 }}>
            <div className="t2 strong" style={{ color: done || current ? "var(--ink)" : "var(--muted)" }}>
              <span className="fig">{["i", "ii", "iii"][i]}.</span> {n}
            </div>
            <div className="t1 muted">{notes[i]}</div>
          </li>
        );
      })}
    </ol>
  );
}
