# SEALED CALL: Colosseum portal paste drafts

Drafted Sun Oct 11 2026, 11:50 AM IST. Facts checked against devnet and the repo the same morning. Kamal: edit into your own words before pasting; nothing here has been submitted.

## Name
SEALED CALL

## Tagline
A memecoin caller and every follower buy in one transaction at one price, and the token stays hidden until that transaction runs.

## Category
Trading and liquidity (DeFi). Pick the closest portal option.

## Short description
SEALED CALL is a commit-reveal vault on Solana. A caller seals a hash of the token and pool, followers deposit SOL blind, and the reveal transaction checks the hash and swaps the whole vault through Meteora DAMM v2 in one swap. Everyone fills at the same price, so there is nothing to front-run.

## Long description
Call channels have a timing problem: by the time followers see the token, bots and the caller have already bought, and followers become exit liquidity.

SEALED CALL removes the window. The caller opens a call with only a 32-byte commitment on chain, sha256(call address, mint, pool, salt), plus their own SOL stake. Followers deposit SOL into the call's vault without knowing the token and can withdraw any time before the reveal. When the caller reveals, one transaction verifies the commitment, checks the pool (seasoned before the call opened, locked liquidity, enough depth, a max price impact) and the mint (no live mint or freeze authority, no Token-2022 transfer fee), then swaps the caller's stake and every deposit in a single Meteora DAMM v2 CPI swap. Followers claim pro rata at once; the caller's tokens stay locked (24 hours by default) so a caller cannot sell into their followers. If the caller never reveals, every follower refunds in full and no fee is charged.

Built with Anchor 0.32.1, a TypeScript SDK, and a Next.js app on Cloudflare Pages that reads every call straight from chain (no database). 39 integration tests run against the real DAMM v2 program dumped from devnet.

## Business model
A 1% fee on every filled vault, taken in the reveal transaction (devnet config fee_bps 100). 30% of the fee goes to the caller and 70% to the protocol treasury, so callers earn only when followers actually fill with them. Lapsed calls pay nothing. Planned, not built: a caller subscription for a verified on-chain track-record page and private follower lists.

## Competition
- CredCall scores and stakes KOLs after a call is already public. SEALED CALL removes the window before the token is public, which is where copy bots front-run.
- Copy-trade tools (GMGN, Axiom) fill followers after the leader's buy is visible on chain, so followers always pay a later price. Here the leader and followers are the same swap.
- Sealbid and Lattice use commit-reveal for token sales and batch matching; SEALED CALL swaps a shared vault through an existing AMM at reveal.
- Precedent: Archer Exchange (Cypherpunk winner) showed batch execution as market structure against MEV. SEALED CALL applies the same idea to caller liquidity; it has no dependency on Archer.

## Traction (devnet)
- Program `JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N` live on devnet.
- From `npm run stats` (Oct 11, 11:45 AM IST): 8 calls executed, 4 distinct follower wallets across revealed calls, 0.11583 SOL swapped on reveal, fee vault 0.002819 SOL.
- Every claimed feature checked end to end on devnet or by test: docs/FEATURE-AUDIT.md (burner wallet, open, seal file, deposit, withdraw, reveal, solo reveal, claim, caller claim after the lock, refund, expire, sweep_dust, fee split).
- 39 of 39 tests passing.
- No outside users yet; invite drafts are waiting for approval.

## Why now
- Judge-side signal: @milianstx asks for market mechanisms that need hiding or batching on transparent chains: https://x.com/milianstx/status/2098040544744112212
- Callers and buyers describe the problem in public: @slingoorio on calls under 50K market cap that "get bundled sniped and farmed" (https://x.com/slingoorio/status/2105210573663174817, now protected, text archived), @skrootimburg on callers who "keep getting bundled" (https://x.com/skrootimburg/status/2105973149053448320), @0xSatre on devs buying 45% in block 0 (https://x.com/0xSatre/status/2105074051538391084), r/SolanaMemeCoins "call channels are just exit liquidity".
- Honest data point: in 17 measured caller posts the median follower paid 3.6% less than the post price, so the pitch is fairness (one price, no front-running), not a discount.

## Links
- Live app: https://sealed-call.pages.dev
- Judge path, 60 seconds: https://sealed-call.pages.dev/try/
- Recorded devnet reveal: https://sealed-call.pages.dev/call/?c=HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3
- Repo: https://github.com/kamalbuilds/sealed-call (PRIVATE; grant hackathon@colosseum.com access before submitting)
- Pitch video: [PLACEHOLDER, not recorded]
- Demo video: [PLACEHOLDER, narrated version not recorded; silent cut at docs/pitch/demo.mp4]

## Team
- Kamal (GitHub kamalbuilds): [PLACEHOLDER role, location, X handle]
- [PLACEHOLDER other teammates, if any]
