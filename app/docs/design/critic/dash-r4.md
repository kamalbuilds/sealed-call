**A Dashboard, not a document: 8**
- A1 PASS: every page is built from bordered cards. Nothing at 1440 runs past 3 lines; the longest is try step 3 at exactly 3.
- A2 PASS: home opens with 4 tiles (0.148 SOL / 13 / 8 / 2) next to "Live from devnet, slot 509,961,065".
- A3 PASS: only Space Grotesk and JetBrains Mono, near-black canvas, no masthead rules.
- Above 7 because the ledger card and metric strip read as a real trading dashboard, not stock shadcn.

**B Hierarchy: 7**
- B1 PASS: you see the H1 first, then the yellow CTA (home "Seal a call", call "Connect a wallet", try "Use a burner wallet"). The call page leads with the yellow fill price.
- B2 PASS: one yellow button per screen on home, call, open and try, at both widths.
- B3 PASS: metric values are 40px mono and labels are 12px muted uppercase.
- Not 8: the yellow mint text down the ledger TOKEN column (13 rows) is a second column of accent, and it pulls the eye away from the primary CTA.

**C Execution: 5**
- C1 PASS: no horizontal overflow at 390 on any page, and nothing clipped.
- C2 FAIL: some text sits off the 12/14/16/20/28/40 scale:
  - the logo glyph is `fontSize: 13` (`components/masthead.tsx:20`)
  - the fill-price exponent is `0.6em` of 40, which is about 24px (`app/call/CallView.tsx:31`)
  - the stamp SVG uses 8px text (`components/seal-stamp.tsx:11`)
- C3 FAIL: linked addresses and transaction hashes render in Space Grotesk, not mono. `.textlink { font: inherit }` (`app/globals.css:138`) comes after `.hash` (`:76`) with the same specificity, so it resets font-family. You can see it on home CALLER (H1dP…1Wp3), the recorded run's hashes, call page "Call HaaRaA…sEtnw3 by HYfB…wfwW", Fill register wallets and the Transactions list. Only non-link IDs (call #13 BxbL…tpkz, mints) are mono.

**D Data UI: 7**
- D1 PASS: every ledger row has a colored chip with text (Filled green, Open blue with countdown, Lapsed grey, Refundable amber), and the call page has a Filled chip.
- D2 PASS: column headers are clear, VAULT, FOLLOWERS and OPENED are right-aligned, and each row is a link with hover styling from source. The mobile view swaps the table for a card list.
- D3 PASS: program id chip, slots (509,961,065 and 507,691,251), explorer transaction links, 1% / 30% fee, 24h lock and countdown deadlines are all visible.

**E Restraint: 5**
- E1 FAIL: semantic blue is used for something that is not a status. The try-page eyebrow chip "For judges, about 60 seconds" is info-blue.
- E2 FAIL: the seal stamp is decoration only.
  - Call page: an 88px seal sits top right and repeats the Filled chip.
  - Open page: a 48px seal sits alone above "What the chain will hold".
  - It is also a leftover from the old Notary look.

**F Coherence: 7**
- F1 PASS: all four routes share one header bar, one card style (10px radius, hairline border, same header band) and one chip style.
- F2 PASS: at 390 the home metrics are 2x2, the ledger becomes cards, the call page's register folds tokens under the wallet, and the open and try rails stack below.
- Not 8:
  - Call page at 390 tiles go 1 / 2 / 1, leaving "27.58M TOKENS OUT" orphaned full-width.
  - Call page at 1440, the COMMITMENT ON CHAIN card stretches to match Transactions and leaves about 200px of empty card.

**Notes (unscored)**
- Data contradiction between widths. Rows #12, #7, #6, #5 and #3 read "claimed" at 1440 but "0 followers" at 390. The desktop cell checks for claimed (`ledger-view.tsx:133`); the mobile line prints `followerCount(e)` raw (`:111`).
- Grammar: "1 followers" on #10 at 390.
- Mobile ledger cards drop the caller, the cap (/0.040) and the open time, so they carry less than the desktop row.
- Slot formatting is mixed: home writes "509,961,065" but the call page writes "Revealed at slot 507691251" and "broken at slot 507691251".
- The 390 header drops the Devnet chip, so the network badge is missing on mobile.
- The try page at 390 was captured while still loading ("Reading devnet."), so the open-call rows in that rail were never checked.
- `open-view.tsx:162` still renders a `<sup className="fn">1</sup>` footnote marker after sealing, which is a footnote leftover the DESIGN refusals ban. It isn't visible in these shots.
- Blind spot: I scored hover states, focus rings and the 4px spacing grid from source and stills only. Nothing was exercised live.

SCORES: A=8 B=7 C=5 D=7 E=5 F=7 avg=6.5 min=5
