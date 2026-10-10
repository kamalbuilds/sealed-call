A: 7
- A1 pass: paper, ink, ruled rows and one red seal action on home; broken stamp on call; § deed on open.
- A2 pass: no cards, gradients, shadows, pills, mono caps or emoji in screenshots or app source; no em dashes in app source.
- A3 pass: "The caller buys with you, in the same transaction, at the same price." and the call-page "one swap ... split pro rata" line.

B: 7
- B1 pass: thesis line first; ledger total 0.047 and all three rows above the fold at 1440x900.
- B2 pass: "The seal is broken." then red "1.077 × 10⁻⁹ SOL", the first figure after the state.
- B3 pass: open page reads § 1 pool, then § 2 stake and cap, then § 3 terms.
- B4 pass: one red action per captured screen (Seal a call / Connect a wallet).

C: 4
- C1 FAIL: at 390 the open-page pool address input is cut mid-string at the right edge ("...YiC"). Passes: no horizontal scroll, and ledger and fill-register figures are `lining tabular-nums`.
- C2 FAIL: open page shows the raw 44-character pool hash, neither shortened nor grouped; one fix (group in 4s, wrap or shorten) clears C1 and C2 together.
- C3 FAIL: five tokens (globals.css:14) and radius 0 pass, but `sup.fn { font-size: 0.7em }` (globals.css:129) renders footnote markers at 9.1, 11.9 and 15.4px, off-scale. Fix: `font-size: var(--t1)` on `sup.fn`.
- C4 pass: red only on sealed-state text, the fill price, one primary button and the seal in each captured screen. Blind spot: `.err` uses seal red, not captured.
- C5 pass: ledger opens from `seedEntries`; call page from `seedCall` (CallView.tsx:46); no loading-only first paint.

D: 7
- D1 pass: home has slots 507691251 and 509,597,687, tx links, Meteora DAMM v2, 1% fee, 24 h lock; call and open pages each have 3+.
- D2 pass: redaction bar on the lapsed № 2 token (never revealed) and "Hidden once sealed" on open; seal crack path drawn in the broken state (seal-stamp.tsx:15). Blind spot: reveal motion checked in code, not in stills.
- D3 pass: footnoted tx links on home and "in transaction 3TiD…3bhdJ" with slots on call.

E: 7
- E1 pass: seal only on call (broken) and open (beside "What the chain will hold"); none decorative on home.
- E2 pass: most repeated items are "Seal a call" (nav + red button) and 1.077 × 10⁻⁹ (hero + footer), both 2x.
- E3 pass: margin holds footnotes and the № 1/№ 3 token note, not body copy.

F: 6
- F1 pass: home ledger table, call price + terms strip + fill register, open § deed form.
- F2 FAIL: against the last 8 design-log entries, two of four fingerprint dimensions match. Macrostructure "Long Document" with margin rail matches 2026-10-10 backed ("Long Document controls sheet ... incident rail") and 2026-09-26 assay ("ruled register + margin rail"). Palette and accent (paper #EFE6D2, ink, seal #A3201B) match 2026-09-27 nansen-meridian (porcelain #F2EEE5, ink, vermilion #C23A1E). Display face (Bodoni Moda) matches none of the eight.
- F3 pass: negative reference has drop shadows, tilted card, wax-blob seal, mono caps and em dashes; ours has none. Copy lede "The caller buys with you" sits close to the negative's "...not before you."

Notes (unscored):
- Public-surface breach: `components/ledger-view.tsx:105` reads "Planned, not built." Public copy confesses a gap; move it to `.progress/LEDGER.md` or cut it.
- DESIGN.md drift: `.display` tracking is -0.015em (globals.css:35) vs -0.02em in DESIGN.md. The "three-step register" timeline (DESIGN.md:28) is absent; home shows a six-row record list (ledger-view.tsx:83-99).
- Blind spot: the C1/C2 clip sits inside an input, so the document-level scrollWidth check (equal to 390) cannot see it. Pre-reveal call state (stage 0) is not in the captures.
- Monogram: "sc" in both states (seal-stamp.tsx:14); the crack is drawn over it on the broken state. Not a mismatch.

SCORES: A=7 B=7 C=4 D=7 E=7 F=6 avg=6.3 min=4
