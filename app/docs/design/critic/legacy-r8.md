**Gate zero:** not run. No brief text was supplied, so no winning verb to check against. The home ledger shows real devnet calls, but I did not check the code path that executes them.

**Per-axis**

- **A Philosophy, 8:** The thesis is clear: "The caller buys with you, in the same transaction, at the same price." The page keeps the DESIGN.md refusals. The negative reference fails them on gradient blooms, drop shadows, an italic "with", mono caps labels and an em dash. Deduction: the home sidebar restates the mechanism twice, in the seal paragraph and again in footnote notes.
- **B Hierarchy, 7:** The call page works: "The seal is broken." leads, then the red `1.077 × 10^-9` price as the figure, then the stat strip and register. On home, the headline sentence is the largest element, the ledger values sit around 15px, and the red "Seal a call" button in the sidebar competes with the table.
- **C Execution, 6:** Hash groups break on boundaries at 1440 and 390 (token line, commitment hash). At 390, "Lapsed, refundable" wraps to three lines, the "Vault, SOL" header wraps to two, and each row carries a "by HYfB…wfwW" sub-line that adds noise.
- **D Specificity, 7:** Real slot numbers, amounts, hashes, Meteora DAMM v2 and the redaction bar are all specific to this product. Deduction: the masthead, edition strip and Notes list are a generic editorial shell a stranger has seen before.
- **E Restraint, 7:** No cards, gradients, shadows or emoji. Deduction: the commit/deposit/reveal register repeats on the call and form pages, and the seal stamp repeats in the sidebar of home and the form.
- **F Variety, 6:** The three pages differ in structure: ledger table, stat strip plus register, numbered § form. They share an identical masthead and edition strip, and the seal-in-sidebar block appears on two pages.

**Resolved since r5:** The call register is populated at both widths (caller plus three followers, matching "Followers 3"). The r5 hash-wrapping fix is already in place in the captures.

**Top 3 fixes**

1. **The home ledger reads as a copy error.** One caller (`HYfB…wfwW`) appears on all three rows, and № 3 and № 1 both show token `CYb9…XNyS`. Check the mints on chain. If they are genuinely the same token, add a footnote saying "one token, two calls". If not, the row data is wrong. Do not add rows that are not on chain.
2. **Give home a real data hero.** The largest element is a sentence, and the figures are small. Add one number derived from the three visible rows, such as total vault SOL (0.011 + 0.006 + 0.030 = 0.047 SOL across three calls, two filled), with a source line naming the slot it was read at. Set it in the same red treatment as the call page price.
3. **Fix the 390 ledger wraps, then measure the pool input.** Shorten "Lapsed, refundable" to "Lapsed" with the refund on a second line, and keep the Entry column on one line. The 44-character pool address appears to end near x≈354 inside a field ending at x≈366, so it probably fits. The scrollWidth against clientWidth is still unmeasured, so do not call it clear until the number is recorded.

**Blind spot:** These are static PNGs. Hover, focus, the reveal motion and live wallet state are unseen. The 390 pool-input overflow is unmeasured.

SCORES: A=8 B=7 C=6 D=7 E=7 F=6 avg=6.8 min=6
