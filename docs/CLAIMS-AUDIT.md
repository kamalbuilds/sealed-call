# SEALED CALL claims audit

Done on Oct 12, 2026, 11:20 AM to 12:00 PM IST. Scope: README.md, the app copy (home ledger, /try, /open, call page, the "Who asked for it" list), docs/pitch/*, docs/SUBMISSION-CHECKLIST.md. docs/PORTAL-DRAFTS.md is not in the repo (removed in `0e4c22c`), so it was not audited. The program and tests were not changed.

| Claim | Location | Source or action |
|---|---|---|
| 39 tests pass | README Tests, pitch, X post 3, checklist | Verified: `npm test` on Oct 12, "39 passing (2m)", exit 0 |
| 1% fee, 30% caller / 70% treasury | README, home "How it pays", pitch, X post 3 | Verified on chain: `scripts/fee-config.ts` reads Config `7qVmxRz8...` as feeBps 100, callerFeeShareBps 3000, treasury `DSansMN7...`, paused false |
| Lapsed calls refund in full, no fee | README, home, call page, pitch | Devnet refund tx `5WKpneDN...` in docs/DEVNET-EVIDENCE.md; test "after the deadline reveal reverts, refunds return every lamport" |
| Caller and three followers filled at one price in one tx, 1.077e-9 SOL per token, slot 507,691,251 | README, home recorded run, /try, pitch, demo script | tx `3TiDGbEQ...` in demo/devnet-run.json and docs/DEVNET-EVIDENCE.md |
| Every path runs on devnet (open, deposit, withdraw, reveal, claims, refund, expire, sweep) | README | Finalized signatures in docs/DEVNET-EVIDENCE.md |
| Pool and mint guards | README, pitch | Tests only (named in README Tests); worded as tested, not demoed |
| Median follower premium -3.62% over 17 posts | README, pitch, X post 2 | docs/evidence/sealedcall-baseline.json (recomputed median -3.62%). X post 2 reworded to say minute prices |
| Traction | README | ADDED "Traction, honestly": no outside users; `npm run stats` Oct 12: 11 executed calls, 0.14355 SOL swapped, 0.003015 SOL fee vault, all from our own demo wallets |
| Security | README | ADDED: no external security audit. No "audited" or "secure" wording found anywhere in public copy |
| @milianstx "Mechanisms that only work with hiding or batching" | home "Who asked for it" | REMOVED. It was a paraphrase, not his words, and he is a judge. Checklist updated to match |
| @slingoorio "Callers under 50K market cap get bundled sniped and farmed", "post since protected" | home, README, pitch, checklist | Post is readable again (api.fxtwitter.com, Oct 12). He is quoting another caller's account, so it is now attributed as "sharing a caller's account" with the exact words "gets bundled sniped and farmed"; "protected" wording removed. Pitch now says "one widely shared post" |
| r/GMGNAI "Followers fill 1 to 2 seconds late and sell into the caller's red candle" | home | REWORDED to the exact quote "I'm obviously 1-2 seconds late and that makes me sell after the token has lost all the value" (post 1wf6doe by u/TheProtester_1, read via arctic-shift) |
| @skrootimburg "the ones who keep getting bundled" | home | Verified (fxtwitter, Oct 12) |
| @0xSatre: dev bought 45% in block 0, 5,000 wallets bought | README | Verified (fxtwitter) |
| @Demaux "52.5K followers" | README | REWORDED to "about 52K" (51,879 on Oct 12); quote verified |
| r/SolanaMemeCoins "call channels are just exit liquidity" | README | Verified: post 1umm7d8 title by u/Hot_Stick6515 (arctic-shift) |
| r/SolanaMemeCoins "57K members" | README | From sol/gtm/sealed-call/USERS.md (57,389 via arctic-shift, Oct 5). Not re-checked: reddit blocked the request |
| Blackhat DYOR "Treat every caller call as a potential exit liquidity event until proven otherwise" | README | Verified: page returns 200 and contains the sentence |
| Three broken features found and fixed in an audit | pitch Sources | The audit file is private (removed in `0e4c22c`), so not checkable from the public repo. Left as is, flagged |
| "Try it in 60 seconds" | /try, README | Judge path from the Oct 11 feature audit; a time estimate, not a measurement |
