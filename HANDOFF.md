# SEALED CALL — backend handoff (stable API)

- Program ID (devnet + localnet): `JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N`
- Deployed binary == `target/deploy/sealed_call.so` (sha256 3b32bd38746d19d6db4347fdd2baa5f6dfafad7e22a088ac39503aa25a91ef02, byte-identical to devnet dump, Oct 10).
- Upgrade authority: `DEawZWJ2gZg5KMaUo2GSu7vTFcAPZ4BPSQ6et8JFQDQ1`
- Config PDA seed: `["config"]`; call PDA `["call", caller, call_id u64 LE]`; vault `vaultPda(call)`; position `positionPda(call, follower)` (use SDK helpers).
- Swap venue: Meteora DAMM v2 `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG`

## IDL / types (frontend should import these, not copy)
- IDL JSON: `sdk/src/idl/sealed_call.json` (synced from `target/idl/sealed_call.json`; `npm run sync-idl` after any rebuild)
- TS types: `sdk/src/idl/sealed_call.ts`
- SDK: `sdk/src/index.ts` — `makeProgram`, PDAs, `commitment()`, `randomSalt()`, `openCallIx`, `depositIx`, `withdrawIx`, `revealAndSwapIx`, `claimIx`, `callerClaimIx`, `refundIx`, `expireIx`, `fetchCalls`, `fetchPositions`, `fetchConfig`.
- App already wraps it in `app/lib/sealed-call-client.ts`.

## Instructions
`init_config`, `set_config`, `set_paused` (admin) · `open_call(call_id, commitment, reveal_window_secs, caller_lock_secs, max_vault_lamports, max_impact_bps, caller_stake_lamports)` · `deposit(amount)` · `withdraw()` · `reveal_and_swap(mint, salt, minimum_amount_out)` · `claim()` · `caller_claim()` · `refund()` · `expire()` · `sweep_dust()` (admin)

## Real devnet run
All signatures in `demo/devnet-run.json` (call `HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3`, mint `CYb9KSmsBEFf7Y7SqRMdF1qCgA6XG7XJ2V1tCPhJXNyS`, pool `9mwSK2b1CL6knpy5A8SK2uv4UJfQ2P7FyKkbYiC19j8K`). Re-run: `npx tsx scripts/devnet-e2e.ts`.
