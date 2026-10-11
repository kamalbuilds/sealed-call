# SEALED CALL 2 minute pitch (about 290 spoken words)

**Problem (0:00 to 0:25)**
On Solana, memecoin callers post a token and their followers rush in after. The followers buy one by one, seconds late, at whatever price is left. Bots see the call coming and get in first. A caller named @slingoorio put it plainly: calls under 50K "get bundled sniped and farmed". A copy trader on Reddit said he lost money because he is "obviously 1-2 seconds late".

**Product (0:25 to 0:50)**
SEALED CALL fixes the order. The caller commits to a hidden token. Only a fingerprint goes on chain. Followers deposit SOL blind into a vault. At reveal, the program checks the token matches, checks the pool and the token are safe, then the whole vault buys in one transaction, at one price, through Meteora. Nobody can jump ahead, because there is nothing to see until it is done.

**Demo beat (0:50 to 1:10)**
On our devnet run, a caller and three followers all filled at exactly the same price, in a single transaction. If the caller never reveals, everyone gets a full refund. The caller's tokens are locked for a while, so they cannot dump on their followers.

**Honest number (1:10 to 1:20)**
We measured 17 real caller posts. Followers did not always pay more. The median was actually 3.6% less. So we do not sell a discount. We sell the removal of front-running and the random spread between the first and last buyer.

**Business (1:20 to 1:40)**
A 1% fee on every filled vault. 30% goes to the caller, 70% to the protocol. Lapsed calls pay nothing. Callers earn by being trusted, not by selling to their followers.

**Demand (1:40 to 1:50)**
Traders keep saying this: callers quitting, followers calling channels "exit liquidity", and Arcium's @milianstx asking for market mechanisms that transparent chains make impossible.

**Ask (1:50 to 2:00)**
It is live on devnet at sealed-call.pages.dev, with 39 passing tests. We want callers to run real sealed calls, and support to take it to mainnet.
