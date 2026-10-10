A Philosophy: **7**
- A1 PASS: paper, ink, ruled rows and one red seal use on every page (r15-1440, r15-call-1440-full, r15-open-1440-full).
- A2 PASS: no cards, pills, shadows, gradients, mono caps or emoji in screenshots or source (`globals.css`, `components/*.tsx`).
- A3 PASS: home hero "The caller buys with you, in the same transaction, at the same price."

B Hierarchy: **7**
- B1 PASS: thesis line and "0.047 SOL sealed" total at top; rows №3 to №1 visible above the fold at 1440x900.
- B2 PASS: "The seal is broken." then the red 1.077×10⁻⁹ fill price is the first figure read.
- B3 PASS: open page runs §1 pool, then §2 stake 0.006 and cap 0.04, then §3 terms.
- B4 PASS: one red primary per screen ("Seal a call" on home, "Connect a wallet" on call and open).

C Execution: **6**
- C1 PASS: scrollWidth equals viewport at 390; table numerals use `.lining` = `lining-nums tabular-nums` (`globals.css:47`).
- C2 PASS: `.hash` is `white-space: nowrap`; long hashes are shortened, and the 390 call token breaks between 4-char groups.
- C3 FAIL: sixth size. `globals.css:105` sets `font-size: 11px` on `.input.hashin` at ≤640px (visible as the smaller pool address in r15-open-390-full). Radius 0 and 4px spacing pass.
- C4 PASS: red appears only on the price hero, the primary button, and the seal stamp on open and call.
- C5 PASS: home rows, call register and open defaults all render from data on first paint.

D Specificity: **7**
- D1 PASS: slot 507,691,251, program JBwReCk6…gU4N, 24 h lock, Meteora DAMM v2 with wSOL, 25% worst impact, sha256(call, mint, pool, salt).
- D2 PASS: lapsed №2 keeps its token as a redaction bar; the call page reveals the token; `seal-stamp.tsx` draws the crack when `broken`.
- D3 PASS: "read from devnet at slot…" plus linked transaction hashes (e.g. 3TiDG…j3bhdJ) on home and call.

E Restraint: **5**
- E1 PASS: stamp appears only where state is shown (broken on call, pre-seal on open); home has none.
- E2 FAIL: home prints "5 Oct, 15:17 IST" four times (two table rows, record rows 1 and 6; hardcoded at `ledger-view.tsx:87` and `:90`).
- E3 FAIL: margin footnote ¹ restates the body reveal row (slot 507,691,251, one swap at one price); the margin lapse note restates "A lapsed call refunds in full and pays nothing."

F Variety: **6**
- F1 PASS: home is ledger table plus record list; call is price hero, terms strip and register; open is § deed form.
- F2 FAIL: round 15 is round 14's tree (`df311de`) plus 17 lines of copy in `ledger-view.tsx`. Same Bodoni Moda, same paper/ink/seal hex, same five-size scale, same macrostructure.
- F3 PASS: negative reference has drop-shadow buttons, mono caps labels and a heavy display hero; current has none of these.

Notes (unscored):
- Axes with all criteria met are capped at 7 here; no evidence that any page is noticeably above the references.
- F2 is scored against commit history because `docs/design/` has no design-log file. Only round 14 and the earlier Fraunces round (`d807029`) were checked. The earlier round's palette and display font differ from round 14's.
- Public-surface rule (outside the rubric): home copy "Planned, not built." and "(post since protected; text archived)" are confessions. They belong in `.progress/LEDGER.md`, not the page.
- Blind spots: 390 full-page captures were viewed downscaled, so small-text reads are approximate. The em dash check covered the literal character in `tsx`/`ts`/`css`, not `&mdash;` entities or markdown.

SCORES: A=7 B=7 C=6 D=7 E=5 F=6 avg=6.3 min=5
lls and offset-shadow buttons. r15 has none. Cream and red palette is shared.

**Notes (unscored)**
- Public surface: home "Next: a caller subscription … Planned, not built." volunteers a gap. Move it to the ledger.
- Provenance: the reveal transaction is abbreviated two ways. Home note 1 uses `3TiDGb…j3bhdJ` (6+6), while the call page and record use `3TiDG…3bhdJ` (5+5). Same signature. Pick one scheme.
- Seal is grey on call but red on open, where nothing is sealed yet.
- ledger-view.tsx:42 has `catch { /* keep the snapshot */ }`, a silent swallow the global rules ban in production paths.
- `.caret` (globals.css:120) is dead CSS.
- Reveal motion (400ms type-in, stamp strike, count-up) and reduced-motion handling (redaction.tsx:10, globals.css:148) are not judged from stills.
- Widow "each." on the home ledger heading at 1440.
- Blind spots: scrollWidth not re-measured; no connected-wallet or reveal-state captures; 4px spacing grid not grepped (C3 already fails, so the score is unchanged).

SCORES: A=7 B=7 C=5 D=7 E=5 F=6 avg=6.2 min=5
