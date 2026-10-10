# SEALED CALL

Commit-reveal batch fill on Solana: a memecoin caller and followers buy the same token in one transaction at one price. The mint stays hidden until the reveal transaction runs.

**Devnet program:** `JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N`

## Tests

Run the full integration test suite:

```bash
npm test
```

The test runner (`scripts/run-tests.sh`) spins up an isolated `solana-test-validator`, dumps Meteora DAMM v2 from devnet, and executes:
- Program configuration initialization
- Caller commitment and call opening
- Follower deposits into the call vault PDA
- Negative case verification: reveal with mismatched mint/hash reverts
- Single-transaction reveal and swap through Meteora DAMM v2 CPI
- Pro-rata token claims by followers and caller lockup verification
- Negative case verification: expired call refund and follower withdraws

## Stats CLI (chain read, no database)

Read on-chain program accounts and metrics directly from Solana (zero database):

```bash
npm run stats -- stats --rpc https://api.devnet.solana.com
```

Or run via `tsx`:

```bash
npx tsx scripts/stats.ts stats --rpc https://api.devnet.solana.com
```

Options:
- `--rpc, -r <url>`: Target Solana RPC URL (defaults to `https://api.devnet.solana.com`)
- `--json`: Output metrics as structured JSON
- `--demo <path>`: Optional path to demo run file to seed follower wallets if positions closed
- `--no-demo`: Skip reading local demo run artifacts

Metrics printed from chain:
- calls executed (revealed state)
- distinct follower wallets across revealed calls
- volume (sum vault SOL swapped on reveal)
- fee vault balance (protocol treasury)

## Devnet Demo Artifacts

Live transaction signatures recorded from Solana devnet are in [demo/devnet-run.json](demo/devnet-run.json):

- **Config init:** `3VDLQm2ghvmrz1V3nQQaFcb8TskEXQ4GcdCVr71VsDza6H67J3nTExztHC8ijpNAf7aWLJhoHD1rnjoTJ4djwrZU`
- **Happy path:**
  - Call opened: `77gcwFyaGyebVQ3uprXwtvgkBguNRCto7yWzrLMcnctNyZXJEWBUiPwD2EbFhVs4pwkt7bbGjnDKEHqkCUXfb6r`
  - Follower deposits:
    - Follower 1: `3SUd6612CvQveyqfuogoXQiFPdC3EWd5wvxdVVKtebDWG1VfwWfEVkjbd5JLvRsPW7B1phtJF2WYTYUP8snZoY73`
    - Follower 2: `3Y2FqPo1mvKhdpimFrCQPn9fRSHkz5FSLq8Cb58FyXJowGaUeM7Jh9WSEQHrFyb2mVkM9fLSUggDbQLMDBQi1zoe`
    - Follower 3: `4Yx932D1dixSRxSuCbrKSg1AuJMbtbkYnUbHdnK5JvjUSA9q665PSy9sfwKbBHd6xjtwpHKvhYM1BDUXQ3XrozJj`
  - Rejected bad reveal: `4huGSTvnMtNvNM8b6VcXmjRQNkftK3sT8iivBxtmExkt82yXUpb9QteatPzPeegPLZz9w2jucEc3qP1cv5QhTVH9`
  - Reveal and swap CPI fill: `3TiDGbEQ3DPXqBnT43U8M9PERz514pcqVWxLkM8nwA3asJ2osHMBdPP44E5vCtv9DjCWXkYSx8MAmdVjjbj3bhdJ`
  - Follower claims:
    - Claim 1: `4iPeiZ9SnzRFbwVv9xCvA3xd4EXeLmwCXfzT57D6UY4cHgkTuk9R9rMtk6VeW8a7J398PZE4zSD9cUHLTk5mc32E`
    - Claim 2: `3PPU2cKjyntUrk3kJi5KyKJokxnSfEdKLSk3LKTRyKPCR7HDj8PcUnjqpYr2V9NF4pBS4HHBfByKfqpeDWxYHpnm`
    - Claim 3: `5gwX9sW4dD3EzdQNngKfyWU8XkC5d5BHay4pxRmb482yDW1T3czdnr9eDjEZE4qPNgoWgXBeEzaoJ4v8KNc1MeaU`
  - Rejected early caller claim: `4iiMTTqSPjhhE4dXCu8n4sqeAGpWLgA2K7SDgbHQGNVWUpRDXpKRUmcdnNCx7PN5yFJpJU8Ha5k13e6HJXruzsn6`
- **Refund path:**
  - Call opened: `5M4CZgzsyumi6YVqruuMkdEZjdxSptgaXHNC4DCVQMGA4tCpX9c2jtdnPxHMVnJvDLBRs2vEuHBK4m8ph3gsopw1`
  - Follower withdraws:
    - `4w9oUPsfUgbmbyGfrVbTCdioYVdQ3hCaDRJxq2Zob8PqdvgWRwxKwHZLv9bu88XXyAegRkMxm7eoMuT4osnDKWD9`
    - `RYSWEFJyQmH8aQzfXpZfnTMtMAjvbAMziBf7z93Tz5ruwRhrudSHD39AC6y8wCJuV6NGGFdEQrhJDEzM32LPSHV`
  - Rejected late reveal: `Ha5oumSm3jneQouQmRU1TxyycdwW5y24h6wmC2VXukqAfhFXWq91QT8gxrDZzcGeynU5xbCqz6NzhgwtbbUMqdH`
  - Expire and refund: `5SeXJgc9m2dTKEh6adrPgFELuX2Hop7Twc8afi45Y5LFmFXaEXR3pjmERsKTuL4YjoTLpFQHrDoq7XZuVVAHbSxa`

## Architecture

```
caller ──open_call(commitment=H(call,mint,pool,salt))──▶ Call PDA + SOL vault PDA
followers ──deposit(SOL)──▶ vault  (withdraw allowed until reveal)
caller ──reveal_and_swap(mint,salt,min_out)──▶ checks hash, pool seasoning/lock/depth,
        mint hygiene (fixed supply, no freeze, no value-taking extensions), max impact
        ──CPI──▶ Meteora DAMM v2 swap: whole vault (caller stake + followers) in ONE swap, ONE price
followers ──claim()──▶ pro-rata tokens      caller ──caller_claim()──▶ after caller lock
no reveal by deadline ──expire() / refund()──▶ SOL back to every depositor
```

- `programs/sealed_call/src/instructions/*`: one file per instruction; `damm.rs` DAMM v2 CPI + pool decoding; `math.rs` pro-rata/impact math (checked u128); `state.rs` Config/Call/Position accounts; `events.rs` emitted on every state change.
- The mint is never on chain before reveal: only the 32-byte commitment, which binds call address, mint, pool and salt.
- Backend is chain-only: the app and `scripts/stats.ts` read program accounts directly, no database.

## How to run

Prereqs: Solana CLI 2.x, Anchor 0.32.1, Node 20+.

```bash
npm install
anchor build && npm run sync-idl     # builds program, refreshes sdk/src/idl
npm test                             # local validator + real DAMM v2 dumped from devnet
npx tsx scripts/devnet-e2e.ts        # full open→deposit→reveal→claim + refund flow on devnet
anchor deploy --provider.cluster devnet   # upgrade (authority DEawZW…)
```

See `HANDOFF.md` for program ID, IDL paths and the SDK surface.

## Repository Structure

- `programs/sealed_call`: Anchor smart contract (Meteora DAMM v2 CPI, commit-reveal, `cpi` feature for external callers)
- `programs/cpi_opener`: Example caller that opens a sealed call from a PDA via CPI (`4SGjnSXNiXNMaoy3wUeW3N3qn8LkZ72XsxT3MenyoD5Z`, local tests in `tests/zz-cpi-opener.ts`)
- `sdk/`: TypeScript client SDK (`fetchCalls`, `fetchPositions`, `fetchConfig`, instruction builders)
- `scripts/`: Devnet runner and `stats.ts` CLI
- `app/`: Next.js web application for devnet calls
- `tests/`: End-to-end integration test suite

## Open Source Note

Open source under Apache-2.0 / MIT for Colosseum Crypto World's Fair review. Grant `hackathon@colosseum.com` access if the repository is private.

## UI

**Live (devnet):** https://sealed-call.pages.dev

The app (`app/`, Next.js static export, Solana wallet adapter: Phantom / Solflare, devnet) is styled as a notary's desk, not a trading terminal: parchment, ink, oxblood wax, Fraunces + IBM Plex Mono. The hidden token is drawn as a redaction bar; the call is an envelope closed with a wax seal generated from the call address.

| Page | Who | What happens |
|---|---|---|
| `/` The Ledger | anyone | every Call account read live from devnet (`getProgramAccounts`), sealed calls with a countdown to the reveal deadline, settled and refundable ones below |
| `/open` Seal a call | caller | pick a Meteora DAMM v2 wSOL pool, set stake, cap, reveal window, lock and max impact (limits read from the on-chain Config). "Press the seal" builds `sha256(call‖mint‖pool‖salt)`, saves the salt in localStorage **before** signing, sends `open_call`, and offers the salt as a `.seal.json` download |
| `/call?c=<call>` | follower | blind deposit with quick amounts, withdraw before reveal, refund after an unrevealed deadline, claim after the fill |
| `/call?c=<call>` | caller | if the browser holds the seal (or you load the `.seal.json`), "Break the seal & fill everyone" sends `reveal_and_swap` with a `minimum_amount_out` derived from pool spot, fee and the call's max impact; caller claim shows a lock countdown |
| reveal ceremony | everyone | when a call is executed: the seal cracks, the flap opens, the mint replaces the redaction bar, a "ONE PRICE" stamp lands, then the fill register fills row by row with every wallet at the identical SOL/token price, linked to the single reveal tx. "Replay the reveal" re-runs it |

Program errors are decoded from the IDL (`lib/program-errors.ts`), so a rejected reveal reads e.g. "revealed (mint, pool, salt) does not match the commitment (6015)".

Screenshots: `docs/screenshots/{home,open,reveal-sealed,reveal}.png`.

Run locally: `cd app && npm install && npm run dev` (set `NEXT_PUBLIC_RPC_URL` for a private devnet RPC). Deploy (Cloudflare Pages, project `sealed-call`): `npm run build && npx wrangler pages deploy out --project-name sealed-call --branch main`.

## Demo (≈90 s)

1. **Ledger** (`/`): the recorded devnet run `HaaRa…Etnw3` is listed as Revealed; open calls show a live countdown.
2. **Watch a reveal**: the envelope for `HaaRa…Etnw3` breaks open; token `CYb9…XNyS`, 0.030 SOL swapped for 27.58M tokens, caller + 3 followers all at 1.077e-9 SOL/token, all in tx `3TiDGb…jbj3bhdJ` (109,404 CU, 852 bytes).
3. **Seal a call** (`/open`, wallet A on devnet): demo pool is prefilled, stake 0.2 / cap 2 SOL, 60-minute window. Press the seal → tx link, download the seal file. The right panel shows what the world sees: a redaction bar and a hash.
4. **Follow** (wallet B, same `/call?c=` link): deposit 0.1 SOL blind. The fill register gains a row priced "sealed".
5. **Break the seal** (wallet A): one signature; the ceremony plays and both rows show the same price. Wallet B claims; wallet A sees its lock countdown.
6. Failure path to mention: no reveal before the deadline → "Take my SOL back" for every follower.

Note: the demo pool must satisfy the program's reveal guards (seasoned before the call opened, locked liquidity, fixed-supply mint), so step 5 uses the e2e pool `9mwSK2…j8K`.

Pool check (Oct 10): `RPC_URL=https://api.devnet.solana.com npx tsx scripts/pool-check.ts` ran a fresh open → deposit → reveal → claim on `9mwSK2…j8K`; reveal executed (call `4sQqsg6LXnw8zdh4xLmCFgQVoJHAZ49UxFaeAt2m1QnF`, tx `zmqTCHYX…B1hjuH`), so the app's prefilled pool still qualifies.
