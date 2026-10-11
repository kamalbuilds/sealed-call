# SEALED CALL demo walkthrough (target 2:50, hard cap 3:00)

Setup before recording:
- Site: https://sealed-call.pages.dev (devnet). Two browser profiles: Wallet A (caller) and Wallet B (follower), both Phantom or Solflare set to devnet and funded.
- The demo wallets hold little devnet SOL. On the open page set stake to 0.006 SOL and cap to 0.04 SOL (defaults are 0.2 and 2 SOL).
- Keep the prefilled demo pool `9mwSK2…j8K`. It passes the reveal guards (seasoned, locked liquidity, fixed supply mint).
- Have the recorded call `HaaRa…Etnw3` ready as a fallback if a live reveal fails.

| Time | Screen action | Narration |
|---|---|---|
| 0:00 to 0:20 | Home page `/` (The Ledger). Slow scroll past sealed calls with countdowns, then settled calls. | "This is SEALED CALL, on Solana devnet. When a caller posts a token today, followers buy one after another, behind the caller and behind the bots. Here, every call is a sealed envelope. Nobody can see the token until it is opened." |
| 0:20 to 0:35 | Click the revealed call `HaaRa…Etnw3`. Click "Replay the reveal". | "This one already happened. Watch: the seal cracks, the token appears, and the caller and three followers all got the same price, in one transaction." |
| 0:35 to 1:10 | Wallet A. Go to `/open`. Show the demo pool, set stake 0.006 and cap 0.04, 60 minute window. Point at the right panel: redaction bar and hash. Click "Press the seal", approve in wallet, download the seal file. | "Now I am the caller. I pick the token and the pool, put up my own stake, and set a cap and a deadline. The chain only gets a fingerprint of my pick, not the token. The secret stays in my browser, and I keep a backup file. This is what the world sees: a black bar and a hash." |
| 1:10 to 1:45 | Copy the `/call?c=` link. Switch to Wallet B profile, open the link. Deposit 0.01 SOL with a quick amount button. Show the new row in the fill register marked "sealed". Hover the withdraw button. | "Now I am a follower. I deposit blind. There is no token to front-run, because nobody knows it yet. My row shows up as sealed. Until the reveal, I can pull my SOL back any time." |
| 1:45 to 2:20 | Switch to Wallet A. Click "Break the seal & fill everyone", approve one signature. Let the ceremony play: seal cracks, token replaces the bar, ONE PRICE stamp, rows fill with the same price. Click the transaction link. | "Back to the caller. One signature. The program checks the token matches the fingerprint, checks the pool and the token are safe, then the whole vault buys in a single swap on Meteora. One transaction, one price for everyone, the caller included." |
| 2:20 to 2:40 | Wallet B. Click Claim, approve. Switch to Wallet A, show the caller claim lock countdown. | "The follower claims their share. The caller's tokens stay locked for a while, so the caller cannot dump on the people who followed." |
| 2:40 to 2:50 | Back to home, point at a refundable call. | "And if the caller never reveals before the deadline, everyone takes their SOL back in full. No fee. A 1% fee is only taken on filled vaults. SEALED CALL: one call, one fill, one price." |

If something fails live: say "here is the same flow recorded on devnet" and show `HaaRa…Etnw3` (0.030 SOL swapped, 27.58M tokens, caller and 3 followers at 1.077e-9 SOL per token, tx `3TiDGb…jbj3bhdJ`).
