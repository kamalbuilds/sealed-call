Scored against the frozen rubric: avg 6.7, min 6. Failing E2 (home repeats the one-price claim three times) and F2 (palette and macrostructure overlap the design log).

**A Philosophy: 7**
- A1 pass: home reads as ruled ledger with № entries, edition line, paper and ink. Seal appears on call and open pages, not home.
- A2 pass: no gradients, shadows, pills or mono caps labels in source or screenshots. No em dashes in product UI (grep hits only AGENTS.md and docs).
- A3 pass: "The caller buys with you, in the same transaction, at the same price." Call page: "one swap ... split pro rata in the register below."

**B Hierarchy: 7**
- B1 pass: thesis line first, 0.047 total at about y360, ledger table ends about y720, above the 900px fold at 1440.
- B2 pass: "The seal is broken." then red 1.077 × 10⁻⁹ as the first figure.
- B3 pass: §1 pool, §2 stake 0.006 and cap 0.04, then §3 terms.
- B4 pass: one red primary in every captured screen. Source: `btn-seal` branches in `CallView.tsx:235-284` and `open-view.tsx:133-134` are mutually exclusive by state.

**C Execution: 7**
- C1 pass: scrollWidth equals viewport at 390 per capture. Ledger and register figures use `.lining` (`lining-nums tabular-nums`, `globals.css:47`).
- C2 pass: table hashes shortened (77gcw…Xfb6r). Call-page hash breaks between four-character groups over two lines.
- C3 pass: scale tokens are exactly 13/17/22/36/60 (`globals.css:14`). `--radius: 0px` (`globals.css:15`). CSS spacing values are multiples of 4.
- C4 pass: red on price hero, `btn-seal` primaries, seal stamp, and sealed countdown (`ledger-view.tsx:20`). Error and focus red are outside the captured states, see notes.
- C5 pass: ledger opens from `useState(seedEntries)` (`ledger-view.tsx:27`). Call opens from `useState(seedCall)` (`CallView.tsx:45`) for snapshot addresses.

**D Specificity: 7**
- D1 pass: home has slot 507691251, tx hashes, Meteora DAMM v2, program ID. Call has 1.077 × 10⁻⁹, 24 h lock, 1% fee with 30% to caller, commitment hash. Open has pool hash, 0.006/0.04 cap, 60 min window, 25% impact.
- D2 pass: redaction bar marks hidden token (lapsed № 2, open page, register rows). Seal stamp shows the crack on the call page (`seal-stamp.tsx:3`). Token shown as text once revealed.
- D3 pass: tx hashes are links (77gcw…Xfb6r, 3TiDG…3bhdJ). Slot numbers named.

**E Restraint: 6**
- E1 pass: seal appears only where it carries state (open page: what the chain will hold; call page: broken state).
- E2 fail: the one-price claim appears three times on home. Thesis "at the same price", ledger headline "2 filled at one price each", record "all three followers at one price". Call page passes (hero caption and footnote, two uses).
- E3 pass: margin notes are footnote pointers ("Filled at slot 507691251; record below"), not body copies.

**F Variety: 6**
- F1 pass: home is ruled ledger plus dated record list plus two-column prose. Call is price folio, terms strip, register. Open is § deed form with numbered clauses and right rail.
- F2 fail: macrostructure overlaps design-log entries `backed` (parameter sheet plus rail, see open-page §3 and right rail) and `pledge` (full-width figure plus numbered clauses plus rail). Palette and accent overlap `nansen-meridian` (porcelain, ink, vermilion: #F2EEE5/#C23A1E against #EFE6D2/#A3201B). Display (Bodoni Moda) and body (Source Serif 4) match none of the last 8. Palette match is a judgement call.
- F3 pass: negative reference has mono caps labels, tilted shadowed ticket card, shadowed buttons. Current has none.

**Notes (unscored)**
- Public-surface copy: "Next: ... Planned, not built." (home, How it pays) and "(post since protected; text archived)" volunteer gaps. CLAUDE.md public-surface rule sends these to the ledger.
- Blind spots: captures wait for data, so first-paint states ("Reading the pool from devnet.", and "Reading the call from devnet." for addresses outside the snapshot) are not in the screenshots. Connected-wallet states, error text (`.err`, red) and focus rings (red) are not captured. B4 and the red-use part of C4 rest on source for those states.
- `.t1` line-height is 1.5 against DESIGN.md's 1.6 prose leading. Not a rubric criterion.
- Open-page stamp is red before sealing. Read as the seal state, judgement call.

SCORES: A=7 B=7 C=7 D=7 E=6 F=6 avg=6.7 min=6
