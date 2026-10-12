# SEALED CALL: Colosseum submission checklist

Deadline: Tue Oct 13 2026, 12:29 PM IST. Verified live on Sun Oct 11 2026, about 1:40 AM IST (not copied from other docs).

| # | Item | Status | Verified how |
|---|---|---|---|
| 1 | Live URL https://sealed-call.pages.dev | DONE | curl: `/` 200, `/try/` 200, `/call/?c=Hec1dV…` 200; headless render shows the ledger with demo callers |
| 2 | `/try/` 60-second judge path | DONE | 200; burner wallet, faucet link, prefilled 0.006 SOL call, caller-only reveal; lists live open calls (A `4ZEuZ…`, D `Hec1dV…`) |
| 3 | Demo video | DONE (silent) | `docs/pitch/demo.mp4` (+ `demo.webm`), 1440x900, 165.6 s (2:46) by ffprobe; one real devnet run following docs/pitch/DEMO-SCRIPT.md |
| 4 | Fee model | DONE | `scripts/fee-config.ts` against devnet config `7qVmxRz8…YWf1`: fee_bps 100 (1% on filled vaults), caller_fee_share_bps 3000 (30% to caller, 70% to treasury `DSansMN7…xw3`), paused false; lapsed calls refund with no fee |
| 5 | Program ID | DONE | `JBwReCk6DRFZREGjCfNiMQUsFFc66FSLBrejnjzKgU4N`: matches `declare_id!`, `solana program show -u devnet` finds it (upgradeable, authority `DEawZWJ2…QDQ1`) |
| 6 | Tests | DONE | `npm test` from the project root: 39 passing, exit 0 |
| 7 | Repo and commit | GAP | Local git repo at `sol/projects/sealed-call`, has NO remote. `gh repo list kamalbuilds` shows no sealed-call repo. See missing items. |
| 8 | README judge section | DONE | `README.md` "For judges: try it in 60 seconds" (plus UI, Demo, Business model sections) |
| 9 | Pitch and demo scripts | DONE | `docs/pitch/PITCH-SCRIPT.md`, `docs/pitch/DEMO-SCRIPT.md` present |
| 10 | Demand evidence | DONE | README "Demand evidence": @slingoorio (readable again Oct 12, text archived), @skrootimburg, @0xSatre, two Reddit threads; @milianstx removed from public copy (he is a judge) |
| 11 | Devnet activity | DONE | Ledger: 11 calls, 6 caller wallets; sealed calls open past the deadline: A `4ZEuZ…` until Oct 14 12:29 AM IST |

## Still missing

- **Narrated video.** The demo is silent. The portal wants a 2 to 3 minute pitch video and an up to 3 minute product demo (sol/docs/SUBMISSION.md). Kamal needs to record a voiceover over `docs/pitch/demo.mp4` following DEMO-SCRIPT.md narration, plus a pitch video (PITCH-SCRIPT.md).
- **Public GitHub repo.** No remote exists. Create one (e.g. github.com/kamalbuilds/sealed-call), push, check it is public, or grant `hackathon@colosseum.com` access if private. Before pushing, confirm `keys/` stays ignored (it is in .gitignore).
- **Colosseum portal account and team roster** (sol/docs/SUBMISSION.md).
- **Portal fields known from sol/docs/COPILOT-PITCH-PASS.md:** `competition` (CredCall, copy-trade UX, Archer), `traction` (program id, devnet run, `npm run stats`, demand links), `whyNow`. Write these in kamal's words; other fields (name, tagline, category, links) are not documented here and need to be read off the portal.
- **Invites** in docs/pitch/INVITES.md are READY FOR KAMAL APPROVAL; none sent.
- Re-run the Copilot crowdedness search before submitting (command in COPILOT-PITCH-PASS.md).
