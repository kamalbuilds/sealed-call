# SEALED CALL: what I'm building and why me (2 minutes)

**What it is (0:00 to 0:20)**
I'm Kamal. I'm building SEALED CALL, on Solana. A memecoin caller and their followers buy the same token in one transaction, at one price, and nobody sees the token until that transaction runs.

**The problem (0:20 to 0:45)**
Today a caller posts a token address and followers buy after it. They fill one by one, seconds apart, behind bots that saw the post first. A caller wrote that small calls get "bundled sniped and farmed". A copy trader on Reddit lost money because he was one to two seconds late.

**How it works (0:45 to 1:05)**
The caller puts only a hash on chain. Followers deposit SOL blind and can withdraw before the reveal. At reveal, the program checks the hash, the pool and the token, then swaps the whole vault through Meteora in one swap. If the caller never reveals, everyone gets a full refund.

**How I think about it (1:05 to 1:30)**
I started out pitching this as "followers overpay". Then I measured 17 real caller posts, and the median follower actually paid 3.6% less than the post price. [KAMAL: confirm the source data for this figure before you say it.] So I changed the pitch. It is not a discount. It removes front-running and the gap between the first and the last buyer. I would rather say the true thing.

**Why me (1:30 to 1:55)**
I build trading tools fast. On GitHub as kamalbuilds I have shipped hundreds of public repos. That includes HyperTWAP-Shield, MEV-protected TWAP orders, and hypermirror, copy trading, both at Hyperliquid hackathons, plus solmate and shadowlend on Solana. [KAMAL: confirm any wins or placings.] SEALED CALL has 39 passing tests and every path verified on devnet.

**Close (1:55 to 2:00)**
It's live at sealed-call.pages.dev. Try it in sixty seconds.
