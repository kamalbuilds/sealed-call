# Design Audit: dashboard-preview.sealed-call.pages.dev

Date: 2026-10-11 (22:01 IST) | Mode: audit only (no source edits, no commits, no deploy)
Pages: `/`, `/call/?c=HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3`, `/open/`, `/try/`
Driver: Brave `deepsurge` profile over raw CDP (Aside not installed; gstack headless Chromium skipped per machine rule). Widths 1440 / 768 / 375.
Calibrated against: `app/DESIGN.md` (clickhouse dashboard ledger contract).

Design Score: B+
AI Slop Score: B+

> Verdict: a coherent dark data surface that holds its own contract. Real chain data on every screen, one yellow action per view, tabular mono numerals, visible yellow focus rings. What holds it back is interaction plumbing (rows that are not links, silent disabled states, no inline validation) and a few dead ends, not the look.

## First Impression (home, 1440)

- The site communicates **a live on-chain ledger with a mechanism, not a pitch page**.
- I notice **the yellow `0.148 SOL` stat and the yellow token mints in the table act as one thread**: yellow means "money/token", and nothing else competes for it except the one primary CTA.
- The first 3 things my eye goes to: **"Sealed calls. One fill, one price."**, **the yellow "Seal a call" button**, **the yellow `0.148` figure**. That is the intended order.
- One word: **credible**.

Page Area Test: header, hero, metric strip, Call ledger, Recorded run, How it pays, Who asked for it. All nameable in under 2 seconds. "How it pays" is the weakest area (three tiles plus a paragraph plus a "Planned" chip).

## Inferred Design System (rendered)

- **Fonts:** Space Grotesk (UI, ~320 nodes), JetBrains Mono (~170 nodes on home). DM Sans appears on one node (wallet adapter modal). Matches DESIGN.md.
- **Colors:** canvas `#0a0a0a`, cards `#1a1a1a`, hairline `#2a2a2a/#3a3a3a`, ink `#fff`, body `#ccc`, muted `#888`, one accent `#faff69`, semantic green/blue/amber chips. Matches the token block.
- **Type scale:** 12 / 14 / 16 / 20 / 28 / 40 on every page. h1 40/700, h2 20/600. No skipped heading levels. `tabular-nums` on 475 nodes on home.
- **Radius:** 4 / 6 / 10 / 999. Matches contract (4px is the hatched "sealed token" bar).
- **Shadow:** one card shadow token everywhere.
- Contrast: chip text measured against composited backgrounds ≈ 7-8:1 (green, blue); muted `#888` on `#1a1a1a` ≈ 4.9:1. Passes AA.

## Classifier

Home: HYBRID (hero persuades, ledger operates). Call, Open, Try: OPERATE.

## Trunk Test

| Page | Result | Gap |
|---|---|---|
| `/` | PASS (5/6) | no search for a call id |
| `/call/` | PARTIAL (4/6) | no nav item marked current, no "Ledger / Call #1" breadcrumb or back link |
| `/open/` | PASS (5/6) | nav marks "Seal a call" |
| `/try/` | PASS (5/6) | nav marks "Try it in 60s" |

## Findings

### FINDING-001 (medium, interaction): ledger rows navigate by `onclick`, not by link
Home ledger `<tr>` has `cursor:pointer`, `tabindex=0` and an onclick handler, but `tbody tr a[href*="call"]` count is 0. The only anchors in a row are explorer links on the caller address. Cmd-click, middle-click, "copy link", and screen-reader link lists cannot reach a call.
Fix: wrap the `#13 BxbL…tpkz` cell in `<a href="/call/?c=…">` (keep the row click as a convenience). Evidence: `home-desktop-full.jpg`, probe `rowAnchorCount: 0`.

### FINDING-002 (medium, content): non-participant on the call page hits a dead end
Connected wallet that was not in call #1 sees "You were not in this call. The next one is on the ledger." with no link to the ledger and no link to an open call. Only a faucet link follows. Evidence: `call-mobile-full.jpg`, probe HTML.
Fix: make "the ledger" a link to `/`, or better, list the open calls inline (the `/try/` rail already renders "Join a live call as a follower" rows; reuse that component).

### FINDING-003 (medium, interaction): `/open/` has no inline validation
Setting stake to `9` with cap `0.04` (also above the 6.03 SOL balance): no error text, no `aria-invalid`, hint still reads "At least 5% of the cap", and "Seal the call" stays enabled. Submit path not exercised (non-local target, mutating). A user learns about the bad value at wallet signature or on-chain failure at best.
Fix: validate on input: stake ≥ 5% of cap, stake ≤ cap, stake ≤ balance, cap ≤ 50; turn the hint red with the specific rule and disable the CTA with the reason.

### FINDING-004 (medium, interaction): disabled "Request 0.1 SOL here" gives no reason
On `/try/` the button is `disabled`, `cursor:not-allowed`, no `title`, no caption. The wallet holds 6.0280 SOL, so the likely reason is "already enough", but the page never says so; next to an enabled "Open the Solana faucet" it reads as broken. Evidence: `try-desktop.jpg`.
Fix: swap the label when funded ("Funded, 6.03 SOL") or add a one-line reason under it.

### FINDING-005 (medium, layout): commitment card on the call page is 65% empty
At 1440 the "Commitment on chain" card stretches to the Transactions card height: 336px tall, content ends at 116px. Evidence: `call-desktop-full.jpg`.
Fix: `align-self: start` on the card, or fold the commitment hash into the Token card header row and let Transactions span full width.

### FINDING-006 (medium, layout/responsive): "Change the pool" wraps inside the pool input on mobile
At 375 the inline button breaks onto two lines inside the input ("Change the / pool", 43px tall); at 1440 the same control is 22px tall (below the 44px target). Evidence: `open-mobile-full.jpg`.
Fix: label "Change", `white-space: nowrap`, and give it a 44px hit area; or move it under the input below 480px.

### FINDING-007 (medium, responsive): mobile ledger drops caller and time
At 375 each ledger row keeps status, token, vault and followers but loses caller and opened time. Caller identity is the product's track-record story ("a track record copy-trade fills cannot fake"), so it is the wrong column to cut. Evidence: `home-mobile-full.jpg`.
Fix: replace the repeated "Token" label line with `caller H1dP…1Wp3 · 10:27`; the token value can sit beside the status chip.

### FINDING-008 (medium, responsive): nav and inline link touch targets below 44px
Nav links 38px tall at every width; "Copy address" 25px; explorer address links 18px; logo link 28px. Evidence: probe `small` lists (28 on home desktop).
Fix: nav `min-height: 44px` (the header already has the room); pad inline address links vertically with a pseudo-element hit area.

### FINDING-009 (medium, content): public home volunteers an unbuilt feature
"How it pays" ends with a `Planned` chip: "Caller subscription, not built". Also "post since protected; text archived" under a quote. Judge-facing surface reading as a status board.
Fix: drop the chip from the public page (track it in `.progress/LEDGER.md`); keep the 1% / 30% / 70% split, which is the real claim.

### FINDING-010 (medium, performance): React hydration error #418 on home
`Minified React error #418 (args: text)` on every home load: server-rendered text differs from the client (most likely the countdowns `15h 29m` or the `slot …, 21:57 IST` line baked at build time in the static export). React discards and re-renders the tree client-side. Home LCP 2.0s, CLS 0.031.
Fix: render time-relative text only after mount (or `suppressHydrationWarning` on those spans).

### FINDING-011 (medium, performance): `/try/` triggers a 429 retry storm on public devnet RPC
37 console errors on one load: `api.devnet.solana.com` 429 with 500ms → 4000ms backoff. The balance eventually renders (6.0280 SOL), but during a judged demo a cold load can sit on stale state.
Fix: point the app at a keyed devnet RPC (Helius/QuickNode) via env, and dedupe the balance and open-calls polls.

### FINDING-012 (medium, AI slop `[nested-cards]`): card-in-card on Call and Open
Call: Token card holds 4 bordered sub-cards; Open: Summary rail holds 4 bordered tiles plus 2 more. Everything on the call page is a hairline card (8 containers). DESIGN.md asks for carded tables and metric tiles, so the outer cards pass; the inner bordered tiles are where it tips into stacked-card UI.
Fix: render inner facts as a definition row (label over value, hairline dividers between, no box).

### FINDING-013 (polish, collected)
- Wallet button reads "Connecting ..." (three dots, space) while autoconnecting; desktop call shot caught it mid-load. Wallet-adapter default; override label to "Connecting…".
- Fill price `1.077 × 10⁻⁹` SOL per token is exact but unreadable at a glance for memecoin users; add a secondary line in market-cap or "1.08 nSOL" terms.
- Followers column mixes counts and the word "claimed" in one column.
- The seal stamp's `SEALED CALL` textPath is 8px (decorative, `role=img` labelled "seal broken": fine for a11y, illegible visually).
- `/try/` step copy runs ~85 characters per line at 1440 (target 45-75).
- "Seal broken. Vault / filled." leaves a one-word last line at 375; `text-wrap: balance` on h1 fixes it.
- No `prefers-reduced-motion` rule found for the reveal strike animation.
- No footer on any page (program id, GitHub, explorer links have no home).
- "For judges, about 60 seconds" chip on `/try/`.
- No skip link.

## Interaction Flow: judge lands on home, tries it, inspects a call

```
Goodwill: 75 ██████████████████████░░░░░░░░
  Home            70 → 80  (+10 "Try it in 60s" and "Seal a call" obvious, real ledger)
  /try            80 → 85  (+5 upfront: "real devnet transaction, nothing simulated")
  /try faucet     85 → 80  (-5 disabled button, no reason)
  /open           80 → 85  (+5 prefilled form saves steps)
  /call #1        85 → 80  (-5 non-participant dead end)
  /call header    80 → 75  (-5 no breadcrumb back to ledger)
  FINAL: 75/100 healthy
```

## Category Grades

| Category | Grade | Driver |
|---|---|---|
| Visual Hierarchy (15%) | B+ | 005 |
| Typography (15%) | A | polish only |
| Spacing & Layout (15%) | B+ | 006 |
| Color & Contrast (10%) | A | tokens held, AA passes |
| Interaction States (10%) | B- | 001, 003, 004 |
| Responsive (10%) | B | 007, 008 |
| Content (10%) | B | 002, 009 |
| AI Slop (5%) | B+ | 012 |
| Motion (5%) | A | transitions explicit, one authored strike |
| Performance Feel (5%) | B | 010, 011 |

Weighted: 3.43 / 4.0 → **Design Score: B+**

AI Slop detail: no gradients, no glows, no blur, no emoji, no centered-everything, no icon-circle feature grid, no em dashes in rendered text (0 found), no `...` in rendered copy except the wallet adapter. The numbered step circles on `/open/` and `/try/` and the four-stat strip are template-adjacent but carry real data the user acts on. The one real tell is card-on-card (012).

## Litmus

1. Brand unmistakable in first screen: YES
2. One strong visual anchor: YES (h1 + yellow stat)
3. Understandable by scanning headlines: YES
4. Each section one job: YES, except "How it pays" (split + paragraph + planned chip)
5. Cards necessary: PARTLY (outer yes, inner tiles no)
6. Motion improves hierarchy: YES (reveal strike)
7. Premium without shadows: YES

Hard rejections: none triggered.

## Quick Wins (each under 30 min)

1. FINDING-001: anchor in the call cell of each ledger row.
2. FINDING-002: link "the ledger", or reuse the open-calls rail.
3. FINDING-006: "Change" + nowrap + 44px target.
4. FINDING-004: reason text on the disabled faucet button.
5. FINDING-009: remove the "Planned, not built" chip from home.
6. FINDING-005: `align-self: start` on the commitment card.

## Summary

- Total findings: 12 medium + 1 polish bundle (10 items). High: 0.
- Fixes applied: 0 (audit-only run, by request).
- Deferred: all, to the next fix pass.
- Design score: B+ (baseline, first run). AI slop: B+.
- Detector: not run (impeccable probe skipped in audit-only mode).
- Outside voices: skipped (audit-only, no source review requested).

PR summary: "Design review found 13 issues (0 high), fixed 0 (audit only). Design score B+, AI slop score B+."

## Evidence

Screenshots in `screenshots/`: `{home,call,open,try}-{desktop,tablet,mobile}[-full].jpg`, raw probes `{page}.json`.
Blind spots: chip contrast was recomputed by hand against composited backgrounds (the automated probe ignores alpha and flagged false 1.3:1 failures); the submit paths for Seal, Deposit, Reveal and Claim were not exercised (non-local, mutating); one wallet state (connected, funded, non-participant) was observed, so the participant views of `/call/` are unaudited.
