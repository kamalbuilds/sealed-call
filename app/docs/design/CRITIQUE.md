# SEALED CALL dashboard redesign: self-critique log (system: clickhouse, contract docs/design/DESIGN.md, rubric docs/design/RUBRIC.md)

## Round 1 (r1-*.png, local build)
1. Home 1440 now reads as a dashboard: metric strip (0.148 SOL / 13 calls / 8 filled / 2 open), chips, carded ledger table. No document look left.
2. 390 home: the ledger table overflows inside its card; the Vault column is cut at the right edge. Worst issue: the core data is clipped on mobile.
3. Open 1440: the yellow "Seal the call" button sits below the fold under three step cards while the right rail is mostly empty.
4. Call 1440: the Transactions card wraps labels into two lines in a 2-column grid; reads ragged.
5. Mono `.hash.t1` links render at 14px next to 12px labels (recorded run, transactions): size mismatch.
6. Metric sub-lines and table muted text are legible but low contrast; acceptable.
7. Seal stamp on the call page is dim grey once broken; it carries state, keep it.
Top 3 to fix: (a) mobile ledger as stacked cards, (b) open-page summary rail with the primary action at >=1024, (c) Transactions as a single-column list and fix .hash.t1 sizing.

## Round 2 (r2-*.png, after fixing r1 top 3)
1. Fixed: 390 ledger is now a stacked card list (status chip, vault, token, followers per row); nothing clipped, scrollWidth 390.
2. Fixed: open page has a sticky summary rail at 1440 with the one yellow action above the fold.
3. Fixed: transactions are a single-column list; mono links now match their 12px labels.
4. 390 home: recorded-run rows keep an 88px label column, so the description wraps into 3-4 short lines. Wasted width.
5. Open rail: "sha256(call, mint, pool, salt)" breaks mid-word ("sal t"), and the stamp duplicates the rail heading.
6. Call 390: the fill price exponent (10^-9) presses against the card edge in the 2-col metric grid.
7. Overall: one accent, chips everywhere status appears, consistent card style across pages.
Top 3 to fix: (a) stack recorded-run rows on mobile, (b) rail seal formula on whole words, smaller stamp, (c) fill price metric spans 2 columns on mobile.

## Round 3 (r3-*.png, after fixing r2 top 3)
1. Fixed: 390 recorded-run rows stack (label, text, tx link) and use the full width.
2. Fixed: rail formula wraps on whole words; stamp is 48px and sits under the action.
3. Fixed: fill price takes the full row on 390, exponent no longer touches the edge.
4. Call 390: the 4th metric (tokens out) is now an orphan half-width tile in a row of its own.
5. Try 1440: step 4 is two paragraphs of 3-4 lines each, the last document-like block in the app.
6. Try rail: the open calls are bare links with numbers; no status chip, no hover row.
7. Slop-check PASS, uicraft 0 high findings.
Top 3 to fix: (a) tokens-out tile spans the row at 390, (b) step 4 cut to a 3-item checklist, (c) open calls in the try rail as hover rows with an Open chip.

## Round 4 (r4-*.png): first fresh critic, frozen rubric (critic/dash-r4.md)
Fresh critic (independent `claude -p`, rubric only): A=8 B=7 C=5 D=7 E=5 F=7, avg 6.5, min 5.
1. C3 fail: linked addresses and tx hashes fell back to Space Grotesk because `.textlink { font: inherit }` overrode `.hash`. Real bug; mono was lost on every link.
2. E2 fail: the seal stamp (call 88px, open 48px) repeats the status chip; decoration left from the print look.
3. C2 fail: off-scale sizes (logo 13px, exponent 24px, stamp 8px text).
4. E1 fail: info-blue used on a non-status chip on /try.
5. Not-8 notes: yellow revealed mints down the ledger compete with the CTA; call 390 metrics 1/2/1 orphan; commitment card stretched; mobile rows said "0 followers" where desktop said claimed; "1 followers".
Top fixes applied (all of the above, the top 3 being mono links, removing the stamp, on-scale sizes): mints in ink inside tables, 5-tile call strip (2/2/2 at 390), cards top-aligned, plural fix, slots comma-grouped, Devnet chip on mobile, leftover footnote marker removed.

## Round 5 (r5-*.png, after round 4 fixes) plus gstack /design-review on the r4 preview (Design B+, AI Slop B+, 0 high)
1. Fixed and visible: links are mono again, no stamp, call strip is 2/2/2 at 390 and five even tiles at 1440, commitment card no longer stretches.
2. Ledger mints read in white; yellow now only on the 0.148 total, the fill price and the one CTA.
3. /design-review FINDING-010: React hydration error #418 on home (countdown computed at build time vs load time).
4. /design-review FINDING-001: ledger rows navigate by onClick only; no real link to open in a new tab.
5. /design-review FINDING-002: a non-participant on a filled call hits a dead-end sentence.
6. /design-review FINDING-006: "Change the pool" wraps inside the pool field at 390.
7. Kept on purpose: FINDING-009 (the "Planned, not built" chip) because the business claims must stay accurate.
Top 3 fixed: hydration (first render uses the snapshot time), a real link in each row's call cell, the dead end now links to the ledger and the seal form; plus the pool field wraps cleanly.

## Round 6 (r6-*.png): fresh critic round 2, same frozen rubric (critic/dash-r6.md)
Fresh critic: A=8 B=8 C=5 D=7 E=8 F=8, avg 7.3, min 5 (up from 6.5/5).
1. C2 fail: spacing off the 4px grid (chip 0 10px / gap 6px, term inputs 6px 10px, 1-2px margins; table cells 14px).
2. C3 fail: the revealed mint on the call page has no explorer link or copy; the ledger token cell has no link of its own.
3. Note: the Followers column mixes numbers and the word "claimed".
4. Note: commitment card is the only card without a header band.
5. Note: yellow step digits on /open and /try thin out the accent.
6. Note: mobile ledger cards drop caller and open time.
7. Kept: the "Planned, not built" chip (accuracy), the scientific fill price (it is the exact on-chain price).
Top fixes applied: every spacing value on the 4px grid, mint gets Copy + Explorer buttons and ledger token cells link to the explorer, "all claimed" as a chip; plus commitment header band, step digits in white, caller and time on mobile cards.

## Round 7 (r7-*.png): fresh critic round 3, final (critic/dash-r7.md)
Fresh critic: A=8 B=8 C=6 D=8 E=8 F=8, avg 7.7, min 6.
1. Only failing criterion: C3. The home "Program JBwR…gU4N" chip has no explorer link or copy, and truncation lengths vary by page (4…4 ledger, 6…6 call, 8…8 open).
2. Every other criterion passes; D rose to 8 with the mint links and claimed chip.
3. Score trend across three fresh-critic rounds on the frozen rubric: 6.5 -> 7.3 -> 7.7 (the retired print design's best was 6.7 on its own rubric).
4. Not fixed after scoring: fixing C3 now would ship unscored code and make r7 stale; it is logged as the first item for the next round.
5. slop-check PASS, uicraft 0 high, cwf banned grep clean; gstack /design-review on the preview: Design Score B+, AI Slop Score B+, 0 high findings.

## Deploy decision
The critic score (7.7, min 6) is below the gate's 8.0 / 7 bar after 3 honest fresh-critic rounds. It is the only gate failure, every other check passes, and the score clearly improved (6.5 -> 7.7, above the 6.7 of the design it replaces), so this ships under the task's rule for that case.

FINAL: 7.7 min=6 round=7 critic=fresh:claude-p-dash-r7 review=/Users/kamal/Desktop/solana/cwf/sol/projects/sealed-call/app/.gstack/design-reports/design-audit-dashboard-preview.sealed-call.pages.dev.md
