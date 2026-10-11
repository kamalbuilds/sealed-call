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
