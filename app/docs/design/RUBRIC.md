# SEALED CALL: frozen critique rubric, dashboard round (committed before any scoring; do not edit during scoring)

Binding direction: docs/design/DESIGN.md (clickhouse dashboard ledger). Each axis 1-10. 7 = every pass criterion met; 8-9 = met and visibly polished beyond a stock shadcn dashboard; 10 = reference-grade product. Each unmet criterion costs 1 from 7. Critic may not add criteria; extras go under notes, unscored.

## A Dashboard, not a document
1. Every page has surfaces (cards/panels with borders), no long paragraph blocks (no paragraph over 3 lines at 1440).
2. Home opens with a summary metric strip: large numbers with small labels, from real ledger data.
3. No serif face, no cream, no print rules or masthead.
## B Hierarchy
1. The squint test: on each page the first read is the page's key figure or title, then the primary action.
2. Exactly one yellow primary action per screen.
3. Metric numbers clearly larger than labels; labels muted.
## C Execution
1. No horizontal scroll at 390; nothing clipped or overlapping.
2. Type scale limited to 12/14/16/20/28/40; spacing on the 4px grid; consistent radii.
3. Numbers tabular; addresses in mono and truncated (abcd…wxyz) with an explorer link or copy.
## D Data UI
1. Status is a colored chip with text on every call row and on the call page.
2. Ledger table/card list has row hover, clear columns, right-aligned numbers.
3. Product-specific facts visible (program id, slots or tx links, fee, deadline).
## E Restraint
1. One accent; semantic colors used only for status/errors.
2. No decoration-only elements; no repeated statement more than twice per page.
## F Coherence
1. Home, call and open/try share one header, one card style, one chip style.
2. Mobile (390) is a deliberate layout (stacked metrics 2x2, cards instead of cramped columns), not a squeezed desktop.

## Output format (required)
Per axis: score, each criterion pass/fail with one line of evidence. Then notes. Last line exactly:
SCORES: A=<n> B=<n> C=<n> D=<n> E=<n> F=<n> avg=<n.n> min=<n>
