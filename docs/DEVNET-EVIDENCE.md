# SEALED CALL on Solana devnet: one signature per path

Program `JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N`. Every signature below was read back with `getSignatureStatuses` (searchTransactionHistory) on https://api.devnet.solana.com on Oct 11 2026 at 22:50 IST: all finalized, `err: null`.

| Path | Signature | Slot |
|---|---|---|
| Open (seal) a call, call [`cnq9uCmu…`](https://explorer.solana.com/address/cnq9uCmutAsvLLTHu3emRet5bKHdMe3iPU4arvq3pFM?cluster=devnet) | [`4xf5YEWb…`](https://explorer.solana.com/tx/4xf5YEWbGFZeZyeKvcJzaeNGoZPYesoend2MC7HbVVb3MWGVs8ciaQCUCkRzkmBDAUczUTaFe2bU6g5dgFU2ARwQ?cluster=devnet) | 509786276 |
| Blind follower deposit | [`4a1cxV5j…`](https://explorer.solana.com/tx/4a1cxV5jnhjYKdTWJ3PBvbqsmS9jpHgMuGAkXQeKJgCpjXCo7dBB7iwMtzHT9XmQb67HGzjD3GGaWenMUHEvwSAQ?cluster=devnet) | 509786375 |
| Withdraw before reveal | [`5QDvVPuD…`](https://explorer.solana.com/tx/5QDvVPuDjQf7MbX6dE8n5RTXxKmZMCY5MLVYiZz9nEyVqFrkwbJcfqcGpuK7exSMVegH7xFmynrN94PR8mvnKDvN?cluster=devnet) | 509786388 |
| Reveal fills everyone at one price, 1% fee split 30/70 in the same transaction | [`2uc47zaX…`](https://explorer.solana.com/tx/2uc47zaXsuogWD1YxWHbkEUMeSLFeam6AEnv1EmCEaa5mjpAKrPyAgVow12AJyqPva6VWtsDezQynkEtXenjxT4Y?cluster=devnet) | 509786703 |
| Solo reveal with the caller's stake, call [`BxbLegv9…`](https://explorer.solana.com/address/BxbLegv97EinAwVzGqmoXYne9itkpRPYVCkC5uLitpkz?cluster=devnet) | [`AqY2fcQ1…`](https://explorer.solana.com/tx/AqY2fcQ1oX1MerX858rqqq1fR2xjVZm7dT47QDYcqQc5XwHQd4hj7Hd7hkYyB5Ui4Ps3XDw4NhhTgGJMSAdLzqB?cluster=devnet) | 509788775 |
| Follower claim, pro rata | [`3mqyKr8i…`](https://explorer.solana.com/tx/3mqyKr8iv3zmx63cApFqQRzJDErazAtx41ePPScVTz72sA1HtMb3cnoxvNrSoxC4ydFBKxbbNp9qE18W8igvvB4s?cluster=devnet) | 509786774 |
| Caller claim after the 24 h lock | [`r2mGz2YM…`](https://explorer.solana.com/tx/r2mGz2YMxRjip1MixiUDi8cjMVyg6THHDpeyd98hy315NgjorLt53GKmaT45NXGM9aGRkreKAW9fPUSDZTWKQXU?cluster=devnet) | 509802361 |
| Full refund after an unrevealed deadline, no fee | [`5WKpneDN…`](https://explorer.solana.com/tx/5WKpneDN8RkASgUfseen6qNT4PTghDQprzQm42aNDieWpDUck3mKyx8sYpqPm2xPBKTgTUJSazcRsZQUbDdKwM1c?cluster=devnet) | 509785943 |
| Expire (mark lapsed) once every follower has refunded | [`54XVxAaS…`](https://explorer.solana.com/tx/54XVxAaScEwMe7d3By31TbhcPBXLBoBbPCfTZ6C9wYWjYdbwYTrpSJk3QEfnrN8JBZ14jAxLaBbnrcpUzNA3zT9f?cluster=devnet) | 509786079 |
| sweep_dust after every claim | [`5FWG8Qfd…`](https://explorer.solana.com/tx/5FWG8QfdBsLWxWzg1dQkodBSUTaj4EMo9MVvNk9ccxzsBub9RnNEJ6HCqDYp9rBnhbHqGHdd9Wa5roG5Q2nvfKBP?cluster=devnet) | 509802421 |
| Recorded reveal, caller and three followers at 1.077e-9 SOL per token, call [`HaaRaA1T…`](https://explorer.solana.com/address/HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3?cluster=devnet) | [`3TiDGbEQ…`](https://explorer.solana.com/tx/3TiDGbEQ3DPXqBnT43U8M9PERz514pcqVWxLkM8nwA3asJ2osHMBdPP44E5vCtv9DjCWXkYSx8MAmdVjjbj3bhdJ?cluster=devnet) | 507691251 |

The pool, mint (Token-2022 extensions, freeze and mint authority), price impact, pause and CPI-opener guards run in `npm test` against a local validator loaded with the real Meteora DAMM v2 program dumped from devnet (39 tests).
