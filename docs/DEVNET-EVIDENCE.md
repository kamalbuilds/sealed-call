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

The pool, mint (Token-2022 extensions, freeze and mint authority), price impact, pause and CPI-opener guards run in `npm test` against a local validator loaded with the real Meteora DAMM v2 program dumped from devnet (43 tests).

## After the money-path audit fix (Oct 12, 2026, ~11:43 AM IST)

Program upgraded with the `reveal.rs` fix (commit `667c0fa`): extend +10,240 bytes, then upgrade tx [`qSkjrxTa...`](https://explorer.solana.com/tx/qSkjrxTasmyZxDH4WQMveziTtxU7BE8tAnYVgQ8XrMNLB4xjgTG2HnqnXPKEGG7MpJ8rh7uccryb7JDHpvmYdRA?cluster=devnet), slot 510169297; the CLI closed the buffer and returned its rent. Re-verified with `scripts/devnet-reverify.ts` on pool `9mwSK2b1CL6knpy5A8SK2uv4UJfQ2P7FyKkbYiC19j8K`, call [`Br39yg5x...`](https://explorer.solana.com/address/Br39yg5xonL5EbeeHsJVxNgeC4NdUbaUcwJ2iJtUUi7w?cluster=devnet):

| Path | Signature |
|---|---|
| Open (seal) | [`3wLtVBQh...`](https://explorer.solana.com/tx/3wLtVBQhyqjTmgXFrR1MKE2BFZV5FEFyVyf83px3o9QZ1eY4YAUCuoRt6JC6E9KHsSKLEkot9pqftRfEAFD3SaXN?cluster=devnet) |
| Blind follower deposit | [`5LxbHXXZ...`](https://explorer.solana.com/tx/5LxbHXXZDisVdyzwiPcAPbf99pLvTM8AGqNNat9vKeVxuWZTMxfrJPdP4hdJYKAyiVrt7ZunkMNPxwn3KARzT1Eq?cluster=devnet) |
| Grief: a third wallet creates the vault's wSOL ATA and puts 1 lamport of wSOL in it | [`2iKSmt2t...`](https://explorer.solana.com/tx/2iKSmt2tNHDioMzkXDAFA2MUMhk4kMZnpuD3kkhRHzYLrYeumVBqeh9WBCB2RF6zzs2rtbbZi1Tvs3h8tpi36Q13?cluster=devnet) |
| Reveal still fills at one price (lamports_in 10,890,000, tokens_out 5,767,221,952,035) | [`4Jh7ynJr...`](https://explorer.solana.com/tx/4Jh7ynJrsqsekvvp9eiXpDJWbia7acY1w71qBjPAq4LnmH9A61wag7ZLAjG1c3Va5z6n6Br6EPUcktTs3fYXRVjN?cluster=devnet) |
| Follower claim, pro rata (2,621,464,523,652 = floor(tokens_out * 5,000,000 / 11,000,000)) | [`3Z418A1R...`](https://explorer.solana.com/tx/3Z418A1RdQQnJGDqhiWiUKDfT21gEBoAVQwKxwff9yX3YyHbrXCFj4Xt3PP75w6s5HabZy2BG1vY16bjzy1fQqkD?cluster=devnet) |
| Caller claim on the upgraded program (call `cnq9uCmu...`, lock passed) | [`GSRrxj7j...`](https://explorer.solana.com/tx/GSRrxj7jCDAyQaku5gi69JxT4LQ2iwWoToJ9iwYKrvfY7YDmRiXAGP9Vn72ycMcHiKwr86wzJR1rPFwnkphzpe2?cluster=devnet) |

The new call's caller lock is 24 h (devnet config minimum), so its caller claim unlocks at Oct 13, 2026 11:43 AM IST.
