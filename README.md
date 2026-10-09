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

## Repository Structure

- `programs/sealed_call`: Anchor smart contract (Meteora DAMM v2 CPI, commit-reveal, `cpi` feature for external callers)
- `sdk/`: TypeScript client SDK (`fetchCalls`, `fetchPositions`, `fetchConfig`, instruction builders)
- `scripts/`: Devnet runner and `stats.ts` CLI
- `app/`: Next.js web application for devnet calls
- `tests/`: End-to-end integration test suite

## Open Source Note

Open source under Apache-2.0 / MIT for Colosseum Crypto World's Fair review. Grant `hackathon@colosseum.com` access if the repository is private.
