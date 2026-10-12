# SEALED CALL: what I'm building and why me (2 minutes)

**What it is (0:00 to 0:20)**
I'm Kamal. I'm building SEALED CALL, on Solana. A memecoin caller and their followers buy the same token in one transaction, at one price, and nobody sees the token until that transaction runs.

**The problem (0:20 to 0:45)**
Today a caller posts a token address and followers buy after it. They fill one by one, seconds apart, behind bots that saw the post first. A caller wrote that small calls get "bundled sniped and farmed". A copy trader on Reddit lost money because he was one to two seconds late.

**How it works (0:45 to 1:05)**
The caller puts only a hash on chain. Followers deposit SOL blind and can withdraw before the reveal. At reveal, the program checks the hash, the pool and the token, then swaps the whole vault through Meteora in one swap. If the caller never reveals, everyone gets a full refund.

**How I think about it (1:05 to 1:30)**
I started out pitching this as "followers overpay". Then I matched 17 real caller posts to minute-by-minute prices. Over the five minutes after a post, the median follower actually paid 3.6% less than the price when it went up. Minute candles are not individual fills, and these were small callers, but it was enough to change the pitch. It is not a discount. It removes front-running and the gap between the first and the last buyer. I would rather say the true thing.

**Why me (1:30 to 1:55)**
I check my own claims. On devnet, one reveal transaction filled a caller and three followers at exactly the same price. 39 tests cover the rest, including the token safety guards that refuse unsafe mints and thin or unlocked pools. Then I audited every feature the site claims, found three that were broken, and fixed them before calling it done.

**Close (1:55 to 2:00)**
It's live at sealed-call.pages.dev. Try it in sixty seconds.

---
Sources (not spoken):
- One-price reveal: call `HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3`, tx `3TiDGbEQ3DPXqBnT43U8M9PERz514pcqVWxLkM8nwA3asJ2osHMBdPP44E5vCtv9DjCWXkYSx8MAmdVjjbj3bhdJ` (caller and three followers at 1.077e-9 SOL per token, slot 507,691,251), in `demo/devnet-run.json` and `docs/DEVNET-EVIDENCE.md`.
- 39 tests: `npm test`; mint guards (live mint or freeze authority, Token-2022 transfer fee) and pool guards (seasoning, locked liquidity, depth, price impact) listed in `docs/DEVNET-EVIDENCE.md`.
- Three broken features found and fixed (burner wallet connect, "Mark the call lapsed" offered too early, /try open-calls list under RPC rate limit): Oct 11 feature audit, kept private (removed from the public repo in commit `0e4c22c`).
- Follower baseline (-3.62% median): `docs/evidence/sealedcall-baseline.json`.
