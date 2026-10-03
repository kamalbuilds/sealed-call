# Sealed Call: program spec (v1)

One program, `sealed_call`, Anchor 0.32.1, Solana 2.3. Quote asset is SOL (wrapped to wSOL only inside the reveal
transaction). Venue: Meteora DAMM v2 (`cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG`, same id on devnet and
mainnet). Output token may be SPL Token or Token-2022 (use `TokenInterface`).

## Idea in one paragraph
A caller opens a call by committing `sha256(mint || pool || salt)` and staking SOL. Followers deposit SOL into the
call's vault without knowing the token. The caller reveals `(mint, pool, salt)` in `reveal_and_swap`, which checks
the hash and swaps the entire vault (caller stake included, minus fee) through one DAMM v2 CPI, so everyone fills at
one price. Followers claim their pro-rata tokens any time after execution. The caller's own pro-rata tokens unlock
only after `caller_lock_secs` (default 24 h), so the caller cannot dump on followers from the batch. If the caller
never reveals before `reveal_deadline`, anyone can crank refunds.

## Accounts

Config, PDA `["config"]`:
- admin: Pubkey; treasury: Pubkey (receives protocol fee, SOL)
- fee_bps: u16 (default 100 = 1%, max 300); caller_fee_share_bps: u16 (share of fee paid to caller, default 3000)
- max_call_lamports: u64 (vault cap per call incl. caller stake); max_deposit_lamports: u64 (per follower)
- min_caller_stake_bps: u16 (caller stake as share of max_vault declared at open, default 500 = 5%)
- min_caller_lock_secs: i64 (floor, default 86_400); max_reveal_window_secs: i64 (default 3 days)
- paused: bool; bump

Call, PDA `["call", caller, call_id.to_le_bytes()]`:
- caller, call_id: u64, commitment: [u8; 32]
- opened_at, reveal_deadline: i64; caller_lock_secs: i64
- max_vault_lamports: u64 (<= config.max_call_lamports)
- caller_stake_lamports, follower_lamports: u64; follower_count: u32
- state: enum { Open, Executed, Expired }
- revealed_mint, revealed_pool: Pubkey (default until reveal)
- lamports_in (swapped, after fee), tokens_out: u64; executed_at: i64; executed_slot: u64
- tokens_claimed: u64 (running sum of all claims incl. caller); caller_claimed: bool
- bump, vault_bump

Vault, PDA `["vault", call]`: system-owned SOL holder (no data). Signs the swap and the token transfers via seeds.
Its wSOL ATA and output-token ATA are created inside `reveal_and_swap` (payer = caller).

Position, PDA `["pos", call, follower]`: follower, lamports: u64, claimed: bool, bump.

## Instructions (every one emits an Anchor event)
1. `init_config(params)` (admin = signer, once), `set_config(params)` (admin only), `set_paused(bool)` (admin only).
2. `open_call(call_id, commitment, reveal_window_secs, caller_lock_secs, max_vault_lamports, caller_stake_lamports)`:
   not paused; reveal_window in (0, max_reveal_window_secs]; caller_lock_secs >= min_caller_lock_secs;
   max_vault <= config cap; caller_stake >= max_vault * min_caller_stake_bps / 10_000 and <= max_vault;
   transfers stake caller -> vault.
3. `deposit(amount)`: not paused; state Open; now < reveal_deadline; follower != caller; amount > 0;
   position.lamports + amount <= max_deposit_lamports; stake + follower_lamports + amount <= max_vault.
   init_if_needed Position (count follower once). SOL follower -> vault.
4. `withdraw()`: state Open (any time before execution, also after deadline); refunds position.lamports in full,
   closes Position to follower; decrements totals and count.
5. `reveal_and_swap(mint, salt: [u8;32], minimum_amount_out)`: caller only; state Open; now <= reveal_deadline;
   not paused; sha256(mint || pool || salt) == commitment; pool owned by DAMM v2; pool's token mints are
   {NATIVE_MINT, mint} in either order (read pool account: token_a_mint at offset per IDL `Pool` layout; validate by
   deserializing with the IDL layout, not by trusting passed mint accounts); total = stake + follower_lamports > 0;
   fee = total * fee_bps / 10_000; caller_fee = fee * caller_fee_share_bps / 10_000; pay caller_fee to caller and
   fee - caller_fee to treasury from vault; lamports_in = total - fee; wrap lamports_in into vault's wSOL ATA
   (system transfer + sync_native); CPI DAMM v2 `swap` with amount_in = lamports_in and minimum_amount_out
   (require minimum_amount_out > 0); tokens_out = output ATA balance delta (read before and after, never trust a
   return value); close the wSOL ATA back to vault; set state Executed, revealed_*, executed_at, executed_slot.
6. `claim()`: follower; state Executed; position not claimed; amount = tokens_out * position.lamports / total
   (u128 math, floor); transfer_checked from vault output ATA to follower ATA (init_if_needed, payer follower);
   mark claimed and close Position to follower; tokens_claimed += amount.
7. `caller_claim()`: caller; state Executed; now >= executed_at + caller_lock_secs; not caller_claimed;
   amount = tokens_out * stake / total (floor); transfer to caller ATA; caller_claimed = true.
8. `refund(follower)` (permissionless crank): state Open and now > reveal_deadline: refund that position in full to
   the follower, close it. `expire()` (permissionless): Open and past deadline and follower_count == 0 after refunds:
   return stake to caller, state Expired. (Followers may also just `withdraw`.)
9. `sweep_dust()`: admin, Executed, every position claimed and caller_claimed: remaining tokens (rounding dust,
   bounded by number of claimants) go to treasury ATA. Not required for v1 if time is short; dust may stay.

`total` in claim math is lamports before fee (stake + follower_lamports at execution); pro-rata is by contribution,
so fee is borne proportionally.

## Invariants to test (unit, integration and fuzz)
- sum of all claims <= tokens_out; dust < number of claimants + 1.
- Followers' and caller's effective price per lamport are equal (same tokens_out / total ratio).
- A reveal with any wrong (mint, pool, salt) reverts; nothing moves.
- Pool whose mints are not {wSOL, mint} reverts; pool not owned by DAMM v2 reverts.
- withdraw after execution reverts; claim before execution reverts; double claim reverts.
- caller_claim before lock reverts, succeeds after (warp clock in tests).
- After reveal_deadline with no reveal: reveal reverts, refund returns every lamport, expire returns stake.
- Caps: per-follower cap, vault cap, min caller stake, max fee enforced; paused blocks open, deposit, reveal (never
  withdraw, refund or claim: users can always get their money out while paused).
- Vault lamport accounting: after every instruction, vault lamports >= rent-exempt + stake + follower_lamports
  while Open.

## Tests
Local validator with DAMM v2 cloned from devnet (`solana-test-validator --clone-upgradeable-program
cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG --url devnet` plus its pool authority/event authority as needed), or
LiteSVM loading the dumped `.so` (`solana program dump -u devnet cpamd... damm_v2.so`). Create a real DAMM v2 pool
(wSOL / test meme mint) with `@meteora-ag/cp-amm-sdk`. Rust proptest for the pro-rata math.

## Kill gate (must be measured first)
`reveal_and_swap` including wrap, fee transfers, DAMM v2 CPI, unwrap fits one transaction under 400k CU with
compute budget set, and the transaction size is under 1232 bytes (use an ALT only if needed). Record CU and size.
