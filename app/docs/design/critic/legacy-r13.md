**Verdict: REWORK.** Round 13 is on-direction and clean, and the average rises from r11's 6.5. The gaps are the home's length, the call page's hierarchy and the phone ledger, not craft.

**Gate zero:** No competition brief was supplied, so it is not applied. The verb executes on devnet: seal, then one-transaction reveal, with reveal tx `3TiDG…3bhdJ` cited on the page.

**r11 status:** #2 mostly landed (price is red at 60px, the four Price cells are now one line). #3 landed as three columns with tokens under the wallet, which follows #2 and drops Price. #1 is partial: the tokens sentence landed; the register and the slot did not.

**A Philosophy: 7.** The position is stated once and carried into the objects: the lede "The caller buys with you, in the same transaction, at the same price", the redacted token bar, and `sha256(call, mint, pool, salt)` in the open page margin. Missing: the first screen never says why a follower should care.

**B Hierarchy: 7.** Home reads 0.047 first, then the lede, then the ledger. On the call page, the 36px "The seal is broken." and a grey seal about 167px wide sit above the 60px red price, so the price is the second read.

**C Execution: 7.** 1px and 3px rules, right-aligned tabular figures, old-style № numerals, and type sizes that read as the DESIGN.md scale. Faults: the call-page Notes (`app/call/CallView.tsx:301-304`) are six numbered transaction links with no matching markers anywhere in the body, so they are dangling footnotes.

**D Specificity: 8.** The domain is in the layout: redacted token, "Replay the reveal", "Lapsed, refundable", and the figures reconcile. Rows sum to 0.030 SOL, and 27.58M tokens × 1.077e-9 = 0.0297 SOL, matching the vault sentence. Deduction: the frame is the Paradigm and gwern post skeleton, which anyone who reads those will recognise.

**E Restraint: 7.** No cards, shadows, gradients, pills, italic headings or mono caps labels, and red is held to the price and the one primary action. Cuts needed: the call page carries a six-cell stat strip and a six-item Notes list that repeats the slot and transactions already in the header. The home's full-page capture is 900px, the same as the viewport, and the ledger ends near 720px with nothing after it.

**F Variety: 6.** Three page structures in one system: a two-column ledger, a single-column register, and a numbered deed form. Against the negative reference, r13 drops every refused tell there: mono caps labels, status pills, offset button shadows, italic emphasis in the headline, the tilted ticket and the radial background. Held at 6 because no `.hallmark/` log exists to measure against earlier rounds and the skeleton is borrowed whole from the references.

**Top 3 fixes**

1. **Home: give it a reason to scroll.** Add the ruled commit, deposit, reveal register under the ledger, as dated rows with each step's slot and transaction. r11 says a home step register is unwanted, but DESIGN.md:28 lists exactly this component. The refusal at DESIGN.md:35 is for I/II/III feature rows, so a ruled timeline with no numerals is in spec. In the same edit, give the provenance line a slot ("read from devnet at slot N, 19:22 IST"). The call page already shows slots and the home does not.

2. **Call page: let the price lead.** Set "The seal is broken." as a 22px deck, keep the 60px red price as the first read, and shrink the grey seal to margin size or drop it from the top row. Cut the six-cell stat strip to the vault amount (0.030 SOL) and worst impact (25%) on one line under the price. Red stays on the price and the one primary action.

3. **390 home: put the caller back.** The phone ledger drops the Caller and Followers columns, so the footnote "№ 1 and № 3 are two calls by one caller" has nothing on screen to check it against. Put the caller under the token, as the call page's 390 register puts tokens under the wallet, and keep №, Vault and Entry.

Blind spot: stills plus source reads of `CallView.tsx` and `open-view.tsx`. Hover, focus, reveal motion (seal crack, token type-in), the wallet-connected state and 390 pool-input overflow are unseen. I did not run the live page or measure scrollWidth.

SCORES: A=7 B=7 C=7 D=8 E=7 F=6 avg=7.0 min=6
son to scroll (it is exactly 900px tall now).
2. **Call page: move the bottom Notes timeline into the body as that register under the price.** Demote "The seal is broken." to a 22px deck. Rewrite the vault sentence to show the bridge: 0.030 SOL in the vault, 1% fee (0.0003 SOL) out first, 0.0297 SOL swapped for 27.58M tokens. This closes the arithmetic on the page and removes the duplicate signatures.
3. **Home at 390: restore Caller.** The ledger drops Caller and Followers, leaving №, Token, Vault, Entry. Put Caller under the token, as the call register does, and keep Followers as a column so a phone reader can see who called and how many joined.

SCORES: A=7 B=7 C=6 D=7 E=6 F=6 avg=6.5 min=6
