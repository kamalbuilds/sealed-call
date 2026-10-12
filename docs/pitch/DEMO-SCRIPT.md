# SEALED CALL demo script (2:50, shot by shot)

Site: https://sealed-call.pages.dev (Solana devnet). Program `JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N`.
Before recording: two browser windows. Window A (caller) and window B (follower), each with a funded devnet burner (use faucet.solana.com; the in-page airdrop often hits the RPC rate limit). Recorded fill: `HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3`.

| Time | Screen | Action | Voiceover |
|---|---|---|---|
| 0:00 to 0:15 | Home: "Open calls, join now" at the top, DEVNET badge and Live chip in the header | Hold, then slowly scroll the open calls list | "This is SEALED CALL on Solana devnet. Open calls come first. Each one is a caller who has staked SOL behind a hidden token." |
| 0:15 to 0:30 | Open call rows with vault fill bars and Join call buttons | Point at a fill bar, then the Program chip | "The bar shows how full each vault is. The token itself is not on chain. Only a hash is." |
| 0:30 to 0:50 | Window A: "Seal a call" (/open) | Press "Use the demo pool". Show stake, vault cap, reveal window, lock and worst price impact | "As a caller, I pick a Meteora pool and set the terms. They are fixed before anyone pays in." |
| 0:50 to 1:05 | Review sheet: "Review sealed call" with simulated outcome, network fee and USD | Read the sheet, press "Sign and send" | "Before I sign, a review sheet shows what will happen and what it costs. It simulates on devnet first." |
| 1:05 to 1:15 | Status chip goes Pending, then Confirmed. "Download the seal", then the new call page | Click "Download the seal", then copy the call page URL (`/call/?c=<new call>`) from the address bar | "Pending, then confirmed. I keep the seal file. Only I can reveal. Now I share the call link with my followers." |
| 1:15 to 1:40 | Window B: window A's new call page, "Follow this call without seeing the token" | Paste the shared link into window B, choose an amount, "Review deposit", "Sign and send" | "As a follower, I join blind. The sheet says it plainly: full refund if the caller does not reveal in time. I can withdraw any time before the reveal." |
| 1:40 to 1:50 | Window A: same call page; fill register gains window B's row | Switch to window A and hold | "My row is in. Its price says sealed, because nobody knows it yet." |
| 1:50 to 2:15 | Window A: same call page, "Reveal and fill everyone" | "Review reveal", "Sign and send", Pending to Confirmed | "Now I break the seal. One transaction checks the hash, the pool and the token, then swaps the whole vault in one swap." |
| 2:15 to 2:35 | Reveal ceremony: seal breaks, token replaces the redaction bar, fill register shows one price per row | Then window B (same call): "Review claim", "Claim my tokens" | "Every row paid the same price. The follower claims right away. The caller's tokens stay locked, so I cannot sell into my followers." |
| 2:35 to 2:45 | Call `HaaRaA1T...Etnw3`, "Replay the reveal" | Press replay | "Here is an earlier run: a caller and three followers, one swap, one price, at slot 507,691,251." |
| 2:45 to 2:50 | Home, DEVNET badge | Hold | "One percent fee only when a vault fills. Lapsed calls refund in full. Try it at sealed-call.pages.dev slash try." |

Fallback if a live step fails on camera: cut to `/call/?c=HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3` and the signatures in `docs/DEVNET-EVIDENCE.md`.
