# Design review: redesign-preview.sealed-call.pages.dev

Date: 2026-10-10
Mode: audit only. No source edits, no commits, no deploys, no wallet connection, no signing.
Binding system: `app/DESIGN.md` ("Notary's ledger"). It has no front matter, so it was read as prose.
Pages: `/`, `/call/?c=HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3`, `/open/`
Widths: 1440 and 375. Captures in `screens-2026-10-10/`.

Design Score: A-
AI Slop Score: A

## Summary

The site follows the binding direction closely. Palette, type families, radius, shadows and gradients all match DESIGN.md, and the reveal works. Open problems: one copy rule break on the home page, a reveal that states two things for about a second, and small touch targets plus some type-scale drift.

## Findings

Ranked by severity.

1. **High. Confession copy on the home page.** Under "How it pays": "Next: a caller subscription for a verified track-record page and private follower lists. Planned, not built." Under "Who asked for it": "(post since protected; text archived)". The public-surface rule bans volunteering a gap and ledger vocabulary such as NOT BUILT. Fix: delete the "Planned, not built." sentence and drop the parenthetical. Record both gaps in `.progress/LEDGER.md`.

2. **Medium. Reveal copy contradicts the headline.** `app/call/CallView.tsx:173` switches the headline to "The seal is broken." as soon as the call is executed. The paragraph at `:197` switches on `stage >= 4`. The reveal auto-plays on mount (`:96`), so for about 1 second on every first visit, and on every Replay click, the page reads "The seal is broken." above "...stay sealed until the caller reveals." Captured at 334 ms and 774 ms (`call-reveal-a-1440.png`, `call-reveal-b-1440.png`). Fix: gate the headline and the paragraph on the same stage.

3. **Medium. Touch targets under 24 px.** Measured at 1440 and 375: "Ledger" 43x20, "Seal a call" 61x20, "Replay the reveal" 106x20, ledger hash links 327x20 at 375, fill-register hashes 86x18 at 1440. WCAG 2.2 AA (2.5.8) asks for 24x24. Fix: pad the `textlink` and row-link hit areas to 24 px without changing the underline.

4. **Medium. Mono used for a control.** "Change the pool" on `/open/` renders in JetBrains Mono 13px inside the `hashin` row. DESIGN.md allows mono for hashes and addresses only. Fix: body face.

5. **Medium. Off-scale type.** DESIGN.md sets five sizes: 13 / 17 / 22 / 36 / 60. Found at 1440: 8px ring text in the seal SVG (call and open), a 30px "sc" monogram in the same SVG, and a 7.8px superscript in the call footnote ("Every row paid 1.077 x 10^-9 SOL a token"). Fix: 13px ring text (or remove it), 36px monogram, 13px footnote superscript.

6. **Low. DM Sans loaded on every page and used nowhere.** Weights 400, 500 and 700 report as loaded on all six captures. No visible element uses DM Sans, and it is not in DESIGN.md. The name comes from `node_modules/@solana/wallet-adapter-react-ui/styles.css`. Fix: scope or drop that stylesheet's font-family.

7. **Observation. Reveal fires on every visit.** The stamp strike (0.3 s, matches the spec) and the reveal sequence run automatically on load of an executed call. The spec calls the reveal one orchestrated moment. Returning visitors see it again each time. Confirm that is intended.

8. **Polish. Console noise.** Every page logs "Phantom was registered as a Standard Wallet", which points at the wallet adapter registering Phantom twice. The evmAsk.js exception comes from a browser extension, not the app.

## What passes

- Palette: only paper, ink, muted, rule and seal red. Red sits on the three permitted jobs: the fill price (call), the primary CTA, and the seal (open).
- Zero radii, box-shadows or gradients across every visible element in all six captures.
- No emoji, em dashes or " -- ". No card, pill or badge class names. No uppercase mono labels.
- Only Bodoni Moda, Source Serif 4 and JetBrains Mono are visible.
- Reduced motion: the stamp strike resolves to 0.001 s under `prefers-reduced-motion`, and the reveal jumps straight to its final stage.
- Reveal timing: strike 0.3 s, matching the 300 ms spec. The 774 ms frame shows the token typing in before the redaction bar.
- No horizontal overflow at 375 or 1440. The 375 layouts stack cleanly, and the open-page margin moves below the form.

## Scoring

| Category | Grade | Basis |
|---|---|---|
| Palette | A | Matches spec |
| Typography | B+ | Findings 4 and 5 (Medium each) |
| Layout and spacing | A | No overflow, clean stacking |
| Motion and state | A- | Finding 2 (Medium) |
| Touch and accessibility | A- | Finding 3 (Medium) |
| Copy and brief compliance | B | Finding 1 (High) |

Design Score: A- (unweighted mean of the six grades, 3.6). The skill's Phase 6 weights were not re-read in this run.

AI Slop Score: A. No generic patterns: no cards, stat trios, gradients, centred hero, emoji or feature rows. The copy has no slop tells.

## Coverage and blind spots

- Wallet-connected states were not exercised: no connect, deposit, fill or signing. Only the disconnected CTA state was measured.
- The reveal was exercised only on the recorded devnet call, through the Replay control. Frames: 334, 774, 1389 and 2892 ms.
- Two widths only (1440 and 375). 768 untested.
- Probes ran in the deepsurge profile via CDP. `bhn deepsurge open` hung, so tabs were created directly on the same profile.
- DESIGN.md has no front matter, so the token tooling returned nothing. Checks used the prose.
- No outside voices (second model or subagent review) were run.
- The working tree is dirty (modified `app/globals.css` and components, plus untracked screenshots). The skill's clean-tree gate was not applied. Nothing was committed or edited.
- Sizes and target boxes are computed at one scroll position. Console output was captured on reload only, so errors that appear after interaction are not covered.

## Evidence

- `screens-2026-10-10/{home,call,open}-{1440,375}-full.png`
- `screens-2026-10-10/call-reveal-{a,b,c,d}-1440.png`
- Probe output (scratch, outside the repo): `/tmp/dr/probe.json`, `/tmp/dr/p2.json`
