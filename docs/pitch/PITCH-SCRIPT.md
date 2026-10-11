# SEALED CALL: 2 minute pitch

**Problem (0:00 to 0:25)**
On Solana, a memecoin caller posts a token and their followers rush in after. They buy one by one, seconds apart, at whatever price is left. Bundlers see the call first and get in ahead. One caller put it plainly: calls under 50K "get bundled sniped and farmed". A copy trader on Reddit lost money because he was one to two seconds late.

**Product (0:25 to 0:55)**
SEALED CALL fixes the order. The caller commits to a hidden token. Only a hash goes on chain. Followers deposit SOL blind into a vault, and can pull it out any time before the reveal. At reveal, the program checks the hash, checks the pool and the token are safe, then swaps the whole vault through Meteora in one transaction, at one price. There is nothing to front-run, because nobody sees the token until it is already bought.

**Proof (0:55 to 1:15)**
On devnet, a caller and three followers filled at exactly the same price in a single transaction. If the caller never reveals, everyone gets a full refund. The caller's tokens stay locked after the fill, so they cannot dump on followers. 39 tests pass.

**Honest number (1:15 to 1:30)**
We measured 17 real caller posts. The median follower actually paid 3.6% less than the post price. So we do not sell a discount. We remove front-running and the spread between the first and the last buyer.

**Business (1:30 to 1:45)**
A 1% fee on every filled vault. 30% goes to the caller, 70% to the protocol. Lapsed calls pay nothing. Callers earn when followers fill beside them, not by selling into them.

**Ask (1:45 to 2:00)**
It is live now at sealed-call.pages.dev. A judge can try it in sixty seconds with a burner wallet. Next we want real callers running sealed calls, an audit, and mainnet.
