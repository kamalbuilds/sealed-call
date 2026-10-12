# SEALED CALL money-path audit (hostile-judge pass, 2026-10-12)

Scope: every lamport and token path in `programs/sealed_call`. Tests: `bash scripts/run-tests.sh`
(local validator with the real Meteora DAMM v2 program dumped from devnet) plus `cargo test -p sealed_call`
(proptests in `math.rs`). Result: **43 mocha tests passing (39 before + 4 new), 11 Rust tests passing.**

## Findings

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | Medium (liveness / censorship, no funds lost) | `reveal_and_swap` required the vault's wSOL ATA to end at exactly 0. Anyone can create that ATA for the vault PDA and send it 1 lamport of wSOL (or raw lamports picked up by `sync_native`) before the reveal, which made every reveal fail with `SwapPartialFill`. Followers would only ever get refunds, so a competitor could kill any call for ~0.002 SOL. | **Fixed in source**: the swap is checked by the wSOL it actually spent (`before - after == lamports_in`); the donation is unwrapped into the vault and returned to the caller with the rent reserve. Not yet on devnet (see below). |
| - | Info | No hard cap on follower count. Bounded in practice by `max_call_lamports / min_deposit_lamports` (50 SOL / 0.001 SOL in tests), and `follower_count` is u32 with checked math. Each claim is its own transaction, so there is no loop that can run out of compute. | Fine |

No insolvency, rounding, double-claim, ordering, signer/owner or account-substitution bug found.
The sibling-product bug classes do not apply: followers escrow real SOL into the vault PDA at deposit
(system transfer, checked by the tests' vault balance asserts), and pro-rata uses floor division whose sum is provably <= tokens_out.

## Paths, invariants, tests

| Path | Invariant | Test(s) | Result |
|---|---|---|---|
| open_call (stake) | vault = stake + rent reserve; stake in [min_bps * max_vault, max_vault]; fee terms frozen on the call | "caller opens with stake...", "opening with a stake below the minimum...", "set_config after deposits..." | Fine |
| deposit | SOL actually moves follower -> vault; per-follower and vault caps; caller cannot deposit; only Open and before deadline | "caller opens with stake...", "per-follower cap and vault cap", "the caller cannot deposit into the own call", "DepositTooSmall" | Fine |
| withdraw | full refund only while Open; position closed so it cannot be refunded or claimed again | "withdraw by a follower before execution...", "withdraw after execution is rejected with WrongState", "audit: refund after reveal ... claim after withdraw finds no position" | Fine |
| reveal_and_swap | fee + lamports_in == stake + follower_lamports (proptest `fee_split_conserves_lamports`); tokens_out is the measured balance delta; min-out and the follower-visible impact bound both enforced; vault SOL ends at 0 | "caller reveals in ONE transaction...", "thin pool ... PriceImpactExceeded", "PoolTooThin", "MinOutZero", hygiene tests, **"audit: a stranger donating wSOL ... cannot block the reveal"** | **Fixed (finding 1)** |
| split_fee (math.rs) | caller_fee + treasury_fee == fee; fee + lamports_in == total; fee <= 3% | proptest `fee_split_conserves_lamports`, `fee_split_example` | Fine |
| claim (follower) | amount = floor(tokens_out * lamports / total); position closed on claim (second claim = AccountNotInitialized); only Executed | "followers claim floor(...)", "double claim fails and moves nothing", **"audit: 12 followers with odd amounts..."** | Fine |
| caller_claim + lock | only after executed_at + lock; `caller_claimed` flag stops a second claim; caller cannot also be a follower | "caller_claim before the lock reverts...", "caller_claim succeeds after the lock and a second one is AlreadyClaimed", "the caller cannot deposit" | Fine |
| refund (after deadline) | only Open and after deadline (reveal uses `<=`, refund `>`; no overlap); position closed; sum of refunds <= follower_lamports, stake untouched | "after the deadline reveal reverts, refunds return every lamport...", **"audit: refund after reveal is WrongState..."**, **"audit: after a refund the follower can neither claim nor refund again..."** | Fine |
| expire | only Open, after deadline, with zero followers left; returns stake + reserve, vault -> 0 | expiry test, "audit: refund after reveal ... expire after reveal is WrongState", "audit: after a refund..." | Fine |
| sweep_dust | only after every follower and the caller claimed; admin only; to config.treasury | "sweep_dust by a non-admin...", **"audit: 12 followers..."** (sweep refused mid-claims and before caller claim) | Fine |

## The two invariants

**Tokens:** each claimant gets floor(T * p_i / P) with sum p_i = P (stake + followers), so sum of claims <= T, and
dust = T - sum < number of claimants. Proven by proptests `sum_of_claims_never_exceeds_tokens_out` and
`dust_is_bounded_by_claimants` and checked on chain in "audit: 12 followers..." (claims + dust == tokens_out exactly).
Tokens donated to the vault's output account are not counted in T (delta measurement) and only reach the treasury via sweep.

**SOL:** while Open, vault = stake + reserve + sum of open positions (+ any donation). Withdraw/refund pay exactly
one position and decrement `follower_lamports`, so sum of refunds <= SOL held, and the stake + reserve stays for
expire. At reveal the vault pays fee + lamports_in == stake + follower_lamports, then the remainder (reserve + donations)
to the caller; the audit tests assert the vault ends at 0 lamports.

## Devnet status

The fix is **not deployed**. An upgrade of the 494,808-byte program needs a buffer account holding ~2.514 SOL
of rent up front (`solana rent 494808`); the upgrade authority `DEawZWJ2...QDQ1` holds 0.2217 SOL.
The live program still has finding 1. Needs ~2.3 SOL more on the deployer (devnet faucet) to upgrade; the buffer rent is refunded after the upgrade.
