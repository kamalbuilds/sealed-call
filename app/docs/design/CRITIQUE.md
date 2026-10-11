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
