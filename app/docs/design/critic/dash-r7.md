Warning: no stdin data received in 3s, proceeding without it. If piping from a slow command, redirect stdin explicitly: < /dev/null to skip, or wait longer.
**A Dashboard, not a document: 8**
1. PASS. Every page is built from bordered cards (metric tiles, ledger card, clause cards, summary rail). The longest paragraph at 1440 is try step 3, at exactly 3 lines.
2. PASS. Home opens with a 4-tile strip of live ledger data: 0.165 SOL / 15 / 10 / 2, with 7 caller wallets and 4 follower fills as sub-labels.
3. PASS. Space Grotesk plus JetBrains Mono on near-black. No serif, cream or masthead.

**B Hierarchy: 8**
1. PASS. Home reads headline, then the yellow 0.165 tile, then "Seal a call". Call reads "Seal broken. Vault filled." then the yellow fill price, then "Connect a wallet". Open and try read their title, then numbered steps.
2. PASS. One yellow button per screen: home "Seal a call", call and open "Connect a wallet", try "Use a burner wallet". The header "Select Wallet" stays grey.
3. PASS. `.metric-v` is 40px (28px at 390). Labels are 12px uppercase muted.

**C Execution: 6**
1. PASS. Nothing overflows or clips at 390. The open pool field "9mwSK2b1…YiC19j8K / Change the pool" is tight but fits.
2. PASS. Font sizes come only from tokens `--t1..t6` = 12/14/16/20/28/40. Spacing classes are all on the 4px grid. Radii are 6/10/999, with minor strays: `.redact` 4px and the wallet icon at 18px.
3. FAIL. The home "Program JBwR…gU4N" chip is a plain `<span>` (`components/ledger-view.tsx:84`), with no explorer link and no copy, on the product's most important address. Truncation also varies: 4…4 in the ledger, 6…6 for "HaaRaA…sEtnw3" on call, 8…8 for "9mwSK2b1…YiC19j8K" on open.

**D Data UI: 8**
1. PASS. Every ledger row has a dot chip with text (Filled / Open plus countdown / Lapsed / Refundable). The call page header has a Filled chip, and the try rail rows have Open chips.
2. PASS. Row hover exists (`globals.css:179`, and the mobile card links in `ledger-view.tsx:109`). Vault, followers and opened columns are right-aligned. Fill register numbers are right-aligned and tabular.
3. PASS. The page shows the program id, "slot 509,965,483", revealed and broken slots, six tx links, "Fee 1%, 30% to caller", "Fee taken 0.0003 SOL", Open countdowns, and "24 h after fill".

**E Restraint: 8**
1. PASS. Yellow is the only accent (CTA, lead stat, mint text). Green, blue, amber and grey appear only in status chips.
2. PASS. The hatched bars mean "token hidden", so they carry information. No statement appears more than twice on any page; "one swap" appears twice on call.

**F Coherence: 8**
1. PASS. One header bar with an active nav pill, one card class (hairline, 10px radius, inset shadow), one chip class used for status, program and context chips.
2. PASS. At 390: metrics go 2x2, and on call the fill price spans full width above the 2x2. The ledger becomes cards. The fill register folds tokens into a sub-line. On open, the CTA moves under the form and the duplicate summary tiles are dropped.

**Notes (unscored)**
- When followers have claimed, the home FOLLOWERS column shows an "all claimed" chip instead of the count. The numeric column loses its number, and mobile says "followers claimed" with no count either.
- `r7-try-390-full.png` was captured with the follower rail still saying "Reading devnet." while desktop shows two Open rows. Re-shoot after the data loads.
- The home "How it pays" card shows a "Planned" chip plus "Caller subscription, not built". It also leaves a large empty area under the content at 1440. At 1440 on call, Commitment and Take part are shorter than the cards beside them and leave visible gaps.
- Two labels for one action: "Select Wallet" in the header and "Connect a wallet" as the page CTA.
- The try page badge "For judges, about 60 seconds" addresses judges directly in the UI copy.
- The call page uses 5 metric tiles, while DESIGN.md specifies 4.

SCORES: A=8 B=8 C=6 D=8 E=8 F=8 avg=7.7 min=6
