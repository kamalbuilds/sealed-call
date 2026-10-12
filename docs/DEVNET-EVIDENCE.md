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

## Sealed DBC launch (Oct 13, 2026)

A call sealed against a Meteora Dynamic Bonding Curve pool that did not exist when the call was opened. The program (upgraded at slot 510468715, upgrade tx [`3GaL8Gn8...`](https://explorer.solana.com/tx/3GaL8Gn852J7rxsvaAH9UoGh6bygQQp2DucgM7dhxTywfGsBQXG5TE8WDYG99a8HuJh9ZEcrSWr8kKDWSSWNnYBs?cluster=devnet)) checks the seal, then CPIs into the DBC program's `swap` once with the whole vault. Run by `scripts/devnet-dbc.ts`; every signature below was read back with `getSignatureStatuses` (searchTransactionHistory) on https://api.devnet.solana.com: all finalized, `err: null` except the two rejected-by-design transactions, which finalized with their program error (HashMismatch, CallerLockActive). Raw output: `demo/devnet-dbc-run.json`.

Call [`DJ4udH4v...`](https://explorer.solana.com/address/DJ4udH4vKekpo9hpZE3YYxWKa8UKYtF8uptbmssiNzQX?cluster=devnet), DBC config [`Bjbbumq2...`](https://explorer.solana.com/address/Bjbbumq25cp63SsfGwvXp5QKvoGHk8UnHn2FDhyYV2MV?cluster=devnet), base mint [`39pn9np1...`](https://explorer.solana.com/address/39pn9np16RAUqxD633WET4TRhFmQBY9x6orFJvAphp94?cluster=devnet), DBC pool [`8i2gKevp...`](https://explorer.solana.com/address/8i2gKevppEuhNBkBQ1Yj52momH28gJTDxk4bS9No4wgW?cluster=devnet).

| Path | Signature | Slot |
|---|---|---|
| Open (seal) the call: the hash commits to a pool address with nothing on chain behind it | [`2kU7NXrS...`](https://explorer.solana.com/tx/2kU7NXrSPFATQWtJyjKr1n4femsbzbeYKWGipcHCf5btw1Rfcw6RxQ5cNioHD2rh6RFUmmZRTDtaM11LgGB2Pfas?cluster=devnet) | 510469145 |
| Blind follower deposit 1 | [`3Mm1xFp7...`](https://explorer.solana.com/tx/3Mm1xFp7GyA6aoDHEsA2sMac9yWcdzfbRHocNYjextZNztTurveJEgizpZgZz6aQzE8Htinhm9eyUB7M5g65smgD?cluster=devnet) | 510469151 |
| Blind follower deposit 2 | [`2LD49ZpN...`](https://explorer.solana.com/tx/2LD49ZpNDXGauQwMbdtSK2LJuvnmxHsVZViy47S8yMdc1ZHuEmA5dDwndj9cdT5a8zpePc46TauBvyZjg3Gqs382?cluster=devnet) | 510469156 |
| Blind follower deposit 3 | [`sTcav4JK...`](https://explorer.solana.com/tx/sTcav4JKVXjSZr6p3mUCBNEttQxFVmDkgSWhatixSYtEyJqyZcNWk46Aw9qqXPxBPL4oC7ErBJtSW63PAKXqHuU?cluster=devnet) | 510469172 |
| DBC create_config (constant-product curve, 1% flat fee, immutable token) | [`2AFubgpV...`](https://explorer.solana.com/tx/2AFubgpVxBS5omuGffxh8Na5qFiJdHZK59t1urgkaLabiU21Zn9oRDAmAwgXRUJPgpVY4KxjE2bBWWk8CYYe4NtV?cluster=devnet) | 510469178 |
| DBC initialize_virtual_pool on the committed config and mint | [`5xp785bM...`](https://explorer.solana.com/tx/5xp785bMK7s2GWt3q8mQNdoVVaerjU7LHXQjGq6FfCbL2EePQzhsGr4gSjDcZtjdHww5RTXWLiq7tV2c75GSaVJh?cluster=devnet) | 510469195 |
| Reveal with a wrong salt: rejected on chain with HashMismatch, vault untouched | [`W2WAZLBY...`](https://explorer.solana.com/tx/W2WAZLBYxY92Qu6PSP8GWEEnD8kut33TjYRNWSxZpjopd44g8aH37V6kKSoTxxGxk81UhjdeVuMQxqmQ3mH2AvU?cluster=devnet) | 510469220 |
| Reveal: one DBC swap for the whole vault (lamports_in 178,200,000, tokens_out 81,721,290,574,508, 134,336 CU, 885 bytes) | [`5tineReK...`](https://explorer.solana.com/tx/5tineReKv1nj7A83fU7ex1U9kMYaGCmy2yWpFwyMB7FfZZ5fKwKY4sRX5qRmRqdpiR5SEX616d11TrHC3kBitiWk?cluster=devnet) | 510469226 |
| Follower 1 claim, pro rata | [`4nvqGwtx...`](https://explorer.solana.com/tx/4nvqGwtxWCFeSXTTMLsE1PEotsbtTzAQudNdHde3GRWP2xFEvYvMnbJpNZW6ZVEqdvMbYear5ictGE4kvyHmHwCx?cluster=devnet) | 510469235 |
| Follower 2 claim, pro rata | [`23tWTiHW...`](https://explorer.solana.com/tx/23tWTiHW2YijqAEkA9uuQSVdSj79zhHFd6jDSM9FuUZz4S53F8EtQM7RcYWfjeAtcoXYgM9bbRuyeMR2qjdTdzHa?cluster=devnet) | 510469241 |
| Follower 3 claim, pro rata | [`3LHyjYkT...`](https://explorer.solana.com/tx/3LHyjYkTbEeBMhcnyU1ioY97xizE4P9jFqb7eJd65LseW6URAkp4LDNk5SQtPip2wWRi69G8m7EycXnJsPx5vGGS?cluster=devnet) | 510469256 |
| Caller claim inside the 24 h lock: rejected on chain with CallerLockActive | [`3LmhuBiY...`](https://explorer.solana.com/tx/3LmhuBiYruKpmEYrRQxuDto9ZaL5ygXfffeXETNWS7D8zyETGNgPGRj6PCe8zPMTmd8QPQ7VeQUGXGD4gv2LoznS?cluster=devnet) | 510469267 |

**One price.** The vault paid 178,200,000 lamports for 81,721,290,574,508 base units in a single swap, equal to the DBC SDK quote for the whole vault read just before the reveal. The curve's base reserve fell by exactly tokens_out and its quote reserve rose by the vault less the 1% curve fee. Follower claims equal floor(tokens_out x deposit / total), so every wallet pays the same lamports per token (spread 1.000000000x). The caller's entitlement of 13,620,215,095,751 base units unlocks at unix 1791943612 (24 h caller lock).

**Control: the same four buys racing a twin launch.** Config [`CGpiS66w...`](https://explorer.solana.com/address/CGpiS66wazZLKkwt3iABFkMm9VejZFaVZ1jjqqz7m1TC?cluster=devnet), pool [`CrvjeMRi...`](https://explorer.solana.com/address/CrvjeMRia38cFfBhjXjMy54BaypCr26923Wf8q8rz3UQ?cluster=devnet), same curve, buyers land one after another with the same lamports (after the same 1% fee):

| Path | Signature | Slot | Lamports per base unit |
|---|---|---|---|
| DBC create_config | [`L2n3ZxsA...`](https://explorer.solana.com/tx/L2n3ZxsAcWxpshL5j8jhjTWpgnkhzUiboBAuDYdbXha7WSoG2gKkLQ9zAeVJsabJ7G2bGfx3no4yL7qGoaBUGVN?cluster=devnet) | 510469277 | |
| DBC initialize_virtual_pool | [`3zsPY2ia...`](https://explorer.solana.com/tx/3zsPY2iaBGJqm6FqBG95532gfQv7gPZmaaHimU6WJkAhZobMWw7Ws1joVUf1VsqYvLhsdQmcWEnj8odotTADeJsn?cluster=devnet) | 510469288 | |
| Buyer 1 swap | [`PGoUfGxW...`](https://explorer.solana.com/tx/PGoUfGxWVZXs5FLnursfBaFjuyAxxwoe15miyrN6APCDo4nGf3jSLtGt3wWkf1E2BxVY6tkjNkY7kA5CqYwBBpr?cluster=devnet) | 510469318 | 2.04693e-6 |
| Buyer 2 swap | [`3rC4U7rg...`](https://explorer.solana.com/tx/3rC4U7rggoAochSXsCtg8ajuQRZU7SSbuuyae9UqBayGPZj8zUZp4112Gs3yWVV6XEkDUUFv2ESA8yjEeeUvtvMb?cluster=devnet) | 510469329 | 2.11013e-6 |
| Buyer 3 swap | [`3bBqBKFf...`](https://explorer.solana.com/tx/3bBqBKFfRgNgzxCFcAVP7xAa7Z3SUZGdp82tSWi1WFpGLZYTWd9jan5U1chQBYJB7JHVyhBg1cG31aVuToE8WQ6D?cluster=devnet) | 510469354 | 2.19279e-6 |
| Buyer 4 swap | [`4AfCxsLC...`](https://explorer.solana.com/tx/4AfCxsLCJwVgJhXonMg2QBEG99u1GwRVssxWfbSXmQKeZpTWFLmc4QoU8UhnsB9YLSHdENpD3L9d28w3561MNBpw?cluster=devnet) | 510469365 | 2.29599e-6 |

Racing buyers paid 1.1217x between first and last; the sealed vault's wallets paid 1.000000000x.

The DBC branch runs in `npm test` against a local validator loaded with the real Meteora DBC program and the Metaplex token-metadata program, both dumped from devnet (17 tests, 60 in the suite).
