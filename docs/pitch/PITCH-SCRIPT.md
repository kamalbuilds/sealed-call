# SEALED CALL: what I'm building and why me (2 minutes)

**What it is (0:00 to 0:20)**
I'm Kamal, and I'm building SEALED CALL on Solana. A memecoin caller and every one of their followers buy the same token in one transaction, at one price. Nobody sees the token until that transaction runs. Not the followers, not the bots, not the mempool.

**The problem (0:20 to 0:40)**
Today a caller posts a token and followers pile in one by one, seconds apart, behind snipers who saw it first. Callers say small calls get "bundled sniped and farmed". A copy trader on Reddit sells at a loss because he is one to two seconds late. Order decides who wins.

**What is new (0:40 to 1:10)**
SEALED CALL turns a call into a sealed auction for one fill. The caller commits a hash. Followers deposit SOL blind. At reveal, one instruction checks the hash, refuses unsafe tokens and thin or unlocked pools, and swaps the whole vault through Meteora in a single swap. The caller's tokens sit in the same fill and stay locked, so the caller cannot front-run their own followers. No reveal, full refund.

**How I think (1:10 to 1:30)**
I measure before I claim. I matched 17 real caller posts to minute prices. The median follower did not overpay. The real damage is the spread between the first and the last buyer, so that is exactly what SEALED CALL removes.

**Why me (1:30 to 1:55)**
I attack my own code. I ran a hostile audit of every lamport path and found that anyone could block a reveal by sending one lamport of wSOL to the vault. I fixed it, upgraded the program on devnet, and a test proves the attack now fails. On devnet, one reveal filled a caller and three followers at exactly the same price.

**Close (1:55 to 2:00)**
It's live at sealed-call.pages.dev. Try it in sixty seconds.

---
Sources (not spoken):
- One-price reveal: call `HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3`, tx `3TiDGbEQ3DPXqBnT43U8M9PERz514pcqVWxLkM8nwA3asJ2osHMBdPP44E5vCtv9DjCWXkYSx8MAmdVjjbj3bhdJ` (caller and three followers at 1.077e-9 SOL per token), in `docs/DEVNET-EVIDENCE.md`.
- "bundled sniped and farmed": https://x.com/slingoorio/status/2105210573663174817. "1-2 seconds late": https://www.reddit.com/r/GMGNAI/comments/1wf6doe/copytrading/
- Token and pool guards: `programs/sealed_call/src/instructions/reveal.rs` (`check_mint`, seasoning, locked liquidity, reserve share, impact), covered by `npm test` (43 tests).
- Reveal-blocking finding and fix: `docs/MONEY-PATH-AUDIT.md`, test "audit: a stranger donating wSOL and raw lamports to the vault's wSOL account cannot block the reveal" in `tests/sealed-call.ts`; devnet upgrade tx `qSkjrxTasmyZxDH4WQMveziTtxU7BE8tAnYVgQ8XrMNLB4xjgTG2HnqnXPKEGG7MpJ8rh7uccryb7JDHpvmYdRA`; griefed-then-filled devnet reveal in `docs/DEVNET-EVIDENCE.md`.
- Follower baseline (-3.62% median, 17 posts, minute candles): `docs/evidence/sealedcall-baseline.json`.
