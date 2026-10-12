Warning: no stdin data received in 3s, proceeding without it. If piping from a slow command, redirect stdin explicitly: < /dev/null to skip, or wait longer.
# Sealed Call critique, round 8 (dashboard ledger)

## A Dashboard, not a document: 5
1. **FAIL.** Every page is built from bordered cards, but on `/open` at 1440 the summary rail paragraph runs to 4 lines ("You stake 0.006 SOL (~$0.67). / Followers can refund in full if you do / not reveal by about Mon 12 Oct, 08:29 / IST."). The limit is 3.
2. **FAIL.** Home does not open with the metric strip. It goes hero, then the "Open calls, join now" panel, and only then the 4 metric tiles. At 1440 the tiles start around y≈560. At 390 they start around y≈870, below the first screen.
3. **PASS.** Everything uses Space Grotesk and JetBrains Mono on near-black. There is no cream, no serif, no masthead and no print rules.

## B Hierarchy: 7
1. **PASS.** Each page reads title first, then the primary action: the home headline then the yellow "Seal a call"; on `/call` the title and the yellow 1.077×10⁻⁹ fill price; "Seal a call" then the yellow rail CTA on `/open`; numbered step 1 then "Use a burner wallet" on `/try`.
2. **PASS.** Each screen has exactly one yellow button: "Seal a call" on home, "Connect a wallet" on `/call` and `/open`, "Use a burner wallet" on `/try`. The filled blue "Join call" buttons are scored under E.
3. **PASS.** Stat numbers are 40px, with 12px uppercase labels in a muted grey (`--label #b8b8b8`) and sublabels in `--muted`.

## C Execution: 7
1. **PASS.** No horizontal scroll at 390 on any of the four routes. The ledger becomes a card list with nothing clipped, and the header nav drops cleanly to a second row.
2. **PASS.** `globals.css` defines only `--t1..--t6` (12/14/16/20/28/40), and every `font-size` uses those variables. Spacing follows the 4px grid. Radii are 6px, 10px and 999px.
3. **PASS.** `tabular-nums` is set on the body. Addresses are mono and truncated (`HYfB…wfwW`) with an underlined explorer link. The full mint on `/call` comes with "Copy mint" and "Explorer" buttons.

## D Data UI: 8
1. **PASS.** Every ledger row (desktop and 390) and the `/call` header carry a chip with a dot and text: Filled, Lapsed, "Lapsed, refundable", "Sealed, 5h 57m".
2. **PASS.** Rows highlight on hover (`.ledger tr.row:hover td` at `globals.css:190`). Columns are labelled in uppercase, and the VAULT and OPENED numbers are right-aligned with inline fill bars.
3. **PASS.** Product facts are visible: program id chip with ↗, live slot 510,105,763, reveal slot 507,691,251, six tx hash links, fee 1% / 30% to caller, refund deadlines, a 24h lock, and the sha256 commitment.

## E Restraint: 5
1. **FAIL.** There is a second accent. `--secondary: #60a5fa` is not in the DESIGN.md token block, yet it fills the "Join call" buttons (`.btn-join`, `globals.css:140`), the vault bars (`.bar > span`, `:149`), the text-link hover (`:146`) and the DEVNET chip. Blue is acting as an action color, not a status color.
2. **FAIL.** `/call` makes the one-price claim three times: "Every row paid this", "One swap, one price, in transaction 3TiD…bhdJ" and "The reveal: one swap for every row". Slot 507,691,251 also appears twice ("Revealed at slot…" and "Matched and broken at slot…").

## F Coherence: 8
1. **PASS.** All four routes share one header (SC mark, nav, DEVNET, Select Wallet), one `.panel` card style and one `.chip` class family.
2. **PASS.** The 390 layouts are designed for mobile:
   - Home metrics stack 2x2 and the ledger becomes stacked cards (status and vault on top, token and caller below).
   - `/call` puts the hero stat full width over a 2x2 grid, and folds the tokens column under the wallet.
   - `/open` moves the rail CTA under the form.

## Notes (unscored)
- The same call gets two different chip labels: home says "Sealed, 5h 57m" and `/try` says "Open" (`try-view.tsx:131`). DESIGN.md says Open should be blue and Lapsed amber, but the code uses amber for open and red for lapsed.
- `r8-try-390-full.png` was captured while still loading: "Join a live call as a follower" reads "Reading devnet." with no rows.
- On `/call` at 1440, the left column ends after the Commitment card and leaves about 160px of dead space beside Transactions.
- On `/try` at 1440, the live-call rows in the rail stick out about 6px past the card's inner padding.
- In the desktop ledger, the FOLLOWERS column mixes "all claimed" chips with right-aligned counts.

**Blind spot:** I scored static screenshots, so row hover, focus states and the motion timing come from reading CSS, not from seeing them run.

SCORES: A=5 B=7 C=7 D=8 E=5 F=8 avg=6.7 min=5
