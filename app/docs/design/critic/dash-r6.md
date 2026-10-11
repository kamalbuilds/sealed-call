Warning: no stdin data received in 3s, proceeding without it. If piping from a slow command, redirect stdin explicitly: < /dev/null to skip, or wait longer.
## A Dashboard, not a document: 8
1. PASS. Every section sits in a bordered card. The longest paragraph at 1440 is the try page step 3 at exactly 3 lines; the hero subheads run 2 lines.
2. PASS. The home metric strip shows 0.165 SOL, 15, 10 and 2 from the devnet ledger read at slot 509,964,260, with small uppercase labels.
3. PASS. Space Grotesk and JetBrains Mono only, near-black canvas, no print rules or masthead.

## B Hierarchy: 8
1. PASS. At a squint, the title reads first on every page, then the yellow action: Seal a call, Connect a wallet, Use a burner wallet. On home and the call page, the yellow stat number competes with the title, but it does not beat it.
2. PASS. One yellow button per screen. The header "Select Wallet" is grey on every page.
3. PASS. Metric values are 40px (28px at 390) mono. Labels are 12px uppercase in muted grey.

## C Execution: 5
1. PASS. No horizontal scroll or clipping at 390 on any of the four pages. The open-page pool field fits with "Change the pool" inside its border.
2. FAIL. The type scale holds to the 12/14/16/20/28/40 tokens (`--t1` to `--t6`, globals.css:44). Spacing leaves the 4px grid: chip padding `0 10px` with `gap: 6px` (globals.css:114), term inputs `padding: 6px 10px` (globals.css:168), and 1px/2px margins.
3. FAIL. The revealed mint on the call page shows in full (44 characters, chunked, yellow) with no explorer link and no copy (CallView.tsx:200). The ledger TOKEN column is not linked on its own; only the row is.

## D Data UI: 7
1. PASS. Every ledger row (Filled, Open with countdown, Lapsed, Refundable) and the call header carry a chip with text and a dot.
2. PASS. Row hover exists (globals.css:179). Columns are labelled. VAULT, FOLLOWERS and OPENED are right-aligned in tabular mono.
3. PASS. Visible facts: program id JBwR…gU4N, ledger slot, reveal slot 507,691,251, tx links, a 1% fee with a 30/70 split, the open countdown, and the 24h caller lock.

## E Restraint: 8
1. PASS. Yellow is the only accent. Green, blue and amber appear only on status chips (Live, Filled, Open, Refundable).
2. PASS. The hatched bars mean "token sealed", so they are not decoration. No statement appears more than twice. The try page comes closest: "For judges, about 60 seconds" plus the H1 "Try it in 60 seconds", with the nav label not counted.

## F Coherence: 8
1. PASS. All four pages share one header bar, one bordered card with an h-row and hairline, one chip component and one button set.
2. PASS. At 390 the layouts are rebuilt rather than squeezed: home metrics go 2x2, the call page shows fill price full width then a 2x2 grid, ledger rows become two-line cards, the fill register folds TOKENS under the wallet, the nav drops to a second row, and the open-page rail collapses below the form.

## Notes (unscored)
- In the ledger FOLLOWERS column, some rows show the word "claimed" instead of a count, so the column mixes numbers and status. Show the count and put "claimed" in a sub-line or a chip.
- At 390 the home ledger cards drop the CALLER and OPENED fields, so the mobile view shows less than desktop.
- At 1440 the call page's COMMITMENT ON CHAIN card is short and stranded in the left column, with about 200px of empty canvas under it beside Transactions. It is also the only card without the h-row header.
- The fill price shows as `1.077 × 10⁻⁹`, which is hard to read on a trading surface. Lamports per token, or tokens per SOL, would read faster.
- The two wallet buttons use different labels and casing on one screen: "Select Wallet" in the header and "Connect a wallet" in the card.
- The home "How it pays" card has a "Planned / Caller subscription, not built" chip. It is a self-reported gap on a public page and should move to the ledger.
- The step-number digits are yellow on the open and try pages, which spreads the accent thin. It does not count against E1.

SCORES: A=8 B=8 C=5 D=7 E=8 F=8 avg=7.3 min=5
