# SEALED CALL: critique log

Critic: a fresh headless `claude -p` session per round, which never saw the build reasoning and had read-only tools. Full outputs are in docs/design/critic/.

## Phase 1: unfrozen loop (demo-judge persona, hallmark A-F). Stopped because the critic's asks contradicted each other between rounds.
| Round | A | B | C | D | E | F | avg | min |
|---|---|---|---|---|---|---|---|---|
| r2 | 8 | 7 | 5 | 7 | 7 | 5 | 6.5 | 5 |
| r3 | 8 | 7 | 5 | 7 | 7 | 5 | 6.5 | 5 |
| r5 | 8 | 7 | 6 | 7 | 7 | 5 | 6.7 | 5 |
| r8 | 8 | 7 | 6 | 7 | 7 | 6 | 6.8 | 6 |
| r9 | 8 | 7 | 6 | 7 | 7 | 6 | 6.8 | 6 |
| r11 | 7 | 7 | 6 | 7 | 6 | 6 | 6.5 | 6 |
| r13 | 7 | 7 | 6 | 7 | 6 | 6 | 6.5 | 6 |

r14 was committed (df311de) without a score.

## Phase 2: frozen rubric (RUBRIC.md, committed e55d585 before scoring), at most 3 rounds
| Round | A | B | C | D | E | F | avg | min | Failed criteria |
|---|---|---|---|---|---|---|---|---|---|
| r15 | 7 | 7 | 5 | 7 | 5 | 6 | 6.2 | 5 | C3 (11px size), E2 (repeated dates), E3 (margin restates body), F2 |
| r16 | 7 | 7 | 4 | 7 | 7 | 6 | 6.3 | 4 | C1/C2 (pool hash cut at 390), C3 (footnote size off-scale), F2 |
| **r17** | 7 | 7 | 7 | 7 | 6 | 6 | **6.7** | 6 | E and F one criterion each, F2 (macrostructure close to backed/assay in design-log) |

Best round: **r17**, which is what ships. The r16 screenshots were overwritten when r17 was built, so the r16 PNGs in rounds/ show the r17 code; the r16 scores are against the original r16 capture.

## Deploy decision
The critic score is below the gate's 8.0 bar. Kamal's main bot instructed: "If the only gate failure is the critic score below 8, ship anyway". This ships on that instruction.

gstack /design-review on https://redesign-preview.sealed-call.pages.dev: Design Score A-, AI Slop Score A (report: design-review-2026-10-10.md).
Its High finding asks to remove the "Planned, not built" and "post since protected" disclosures from the landing page. I kept them on purpose, because the business model and demand claims must be accurate.

FINAL: 6.7 min=6 round=17 critic=fresh:claude-p-rubric-r17 review=/Users/kamal/Desktop/solana/cwf/sol/projects/sealed-call/app/.gstack/design-reports/design-audit-redesign-preview.sealed-call.pages.dev-2026-10-10.md
