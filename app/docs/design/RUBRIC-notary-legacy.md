# SEALED CALL: frozen critique rubric (committed before scoring; do not edit during scoring)

Scope: the binding direction is ../../DESIGN.md (Notary's ledger). Judge against it and the references in REFERENCES.md, not against a dark trading terminal. Each axis is scored 1-10. **7 = every pass criterion met. 8-9 = met, plus noticeably above the references. 10 = reference-grade. Each unmet criterion costs 1 point from 7.** A critic may not add criteria; anything else goes under "notes", unscored. Criteria that DESIGN.md refuses (cards, step/feature rows on home, stat trios, a dark terminal) may not be requested.

## A Philosophy
1. One position is legible on all three pages: a sealed call is a notarised entry (paper, ink, one seal red, ruled rows).
2. None of the DESIGN.md refusals are visible: cards, gradients, shadows, glows, pills, mono caps labels, emoji, em dashes.
3. The copy states the mechanism (one transaction, one price, the caller buys with followers) in plain words.

## B Hierarchy
1. Home: the first read is either the thesis line or the ledger total, and the ledger is visible above the fold at 1440.
2. Call page: the first figure read after the state is the one fill price.
3. Open page: the pool and the money (stake, cap) read before the secondary terms.
4. At most one primary (red) action per screen.

## C Execution
1. No horizontal scroll at 390; no text clipped or colliding; figures are tabular in tables.
2. Hashes do not break mid-group (they are shortened, or grouped and broken between groups).
3. The type scale is the five DESIGN.md sizes; radius is 0; the spacing looks even on the 4px grid.
4. Red appears only on: the fill price hero, the primary action, and the sealed or seal state.
5. No empty or loading-only state on first paint (the ledger and the call open from data).

## D Specificity
1. At least three product-specific facts are on screen per page (slots, transaction links, commitment, pool type, fee, lock).
2. The token-as-redaction-bar and the seal stamp are used, and they mean something (hidden, then revealed or broken).
3. Provenance: on-chain claims link to a transaction or name a slot.

## E Restraint
1. No element exists only as decoration (the seal appears where it carries state).
2. The same figure or statement is not repeated more than twice on one page.
3. The margins hold notes, not a second copy of the body.

## F Variety
1. The three pages use three different body structures: ledger table, call folio (price, terms strip, register), § deed form.
2. The product does not share its structural fingerprint with the last 8 design-log entries (macrostructure, palette, display font, accent).
3. It is visibly different from the negative reference (design-research/negative/).

## Output format (required)
Per axis: the score, then each criterion number with pass/fail and one line of evidence. Then notes (unscored). Last line exactly:
SCORES: A=<n> B=<n> C=<n> D=<n> E=<n> F=<n> avg=<n.n> min=<n>
