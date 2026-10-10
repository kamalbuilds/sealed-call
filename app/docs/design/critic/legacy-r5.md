## Hallmark critique: SEALED CALL, r5 (static PNGs)

- **A Philosophy 8.** The headline "The caller buys with you, in the same transaction, at the same price" is backed by the seal, № numbering and footnoted transaction signatures on every page. The negative reference's gradients, shadows, tilted card and italic "with" are gone.
- **B Hierarchy 7.** On the 1440 call page the order reads "The seal is broken", then the red price, then the register, which is correct. The three blank register rows pull the eye to nothing, and on the open page stake and vault cap are equal-weight display figures with no single primary decision.
- **C Execution 6.** The r3 regression is fixed: each 390 fill row now carries "Price 1.077 × 10⁻⁹ SOL". Still broken: the seal hash splits mid-string on both widths ("…ddf82ae / 6d93d…" at 390), and the 1440 register shows one filled row plus three empty rules. The pale caller row reads as disabled, with contrast unmeasured.
- **D Specificity 7.** The black redaction-bar token, the seal that goes pale when broken, the 24 h caller lock and the per-row price are this brief, not a generic page. The home ledger undercuts it: one caller (HYfB…wfwW) appears on all three rows and token CYb9…XNyS on two, which reads as fixture data.
- **E Restraint 7.** Radius 0, no shadows, hairline rules, one red CTA per screen. Redundancy remains: the open page's §2 and §3 values (0.006 SOL, 0.04 SOL, 60 min) repeat in the sidebar "Terms" block, and the call page's caller stake and cap repeat the register.
- **F Variety 5.** All three pages share one skeleton: masthead with 3px rule, serif headline, ruled rows with right-aligned figures, right-margin footnotes. r5 changed row contents, not the skeleton, so the score stays at r3's 5.

**Top 3 fixes**

1. **Seed distinct callers and tokens.** The home ledger is the first table a stranger reads. Use four or five callers, unique tokens, and outcomes of filled, lapsed and refunded, with the call page and footnotes matching. Copy the token row's 4-character grouping for the hashes.
2. **Render the call-page register populated on first paint.** The 1440 capture shows blank rules, while the 390 capture of the same route shows four filled rows. DESIGN.md refuses empty loading states, so load from the seeded snapshot synchronously or don't render empty rows. Re-capture both widths after load and check the row count against "Followers 3".
3. **Break hashes on group boundaries, then measure the pool input.** Wrap seal and transaction hashes in nowrap groups so they only break between groups. At 390, measure the pool address input's `scrollWidth` against `clientWidth` and report the number.

Blind spot: these are static PNGs, so hover, focus, reveal motion and live wallet state are unseen. The 1440 blank register may be a capture-timing artifact, so treat it as unverified until re-captured. The 390 pool-address overflow is unmeasured. No brief text was supplied, so gate zero was not run.

SCORES: A=8 B=7 C=6 D=7 E=7 F=5 avg=6.7 min=5
