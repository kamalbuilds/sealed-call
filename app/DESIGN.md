# SEALED CALL: DESIGN.md (binding)

Direction: "Notary's ledger" (cwf/docs/DESIGN-DIRECTIONS.md, Sealed Call row), with the display face changed because uicraft gate bans Fraunces.

## Art direction
A sealed call is a notarised entry, not a trade ticket. The page reads like an auction catalogue's results page set as a research paper: one editorial column, a margin carrying footnotes (transaction signatures) and the seal, ruled rows instead of cards.

Structure stolen from: Paradigm research posts (720px text column, left/right margin apparatus, 38px display at -1.14px tracking), gwern.net and Tufte CSS (sidenotes in a right margin), Christie's auction results (light serif display 48px weight 300, lot listings as ruled rows, month index rail).

## Type (two families + a mono for hashes only)
- Display: **Bodoni Moda** 400/500 (catalogue didone; Christie's arizonaSerif and Paradigm Serif are high-contrast book faces). Tracking -0.02em at 36px and up.
- Body: **Source Serif 4** 400/600 (gwern's body face; old-style figures in prose, `lining-nums tabular-nums` in tables).
- Hashes and addresses only: **JetBrains Mono** 400, 13px. No mono uppercase labels.
- Scale (five sizes): 13 / 17 / 22 / 36 / 60 px. Leading 1.6 prose, 1.3 at 22, 1.02 display.

## Colour (70 / 20 / 10)
- Paper #EFE6D2 (70%), ink #1C1A17 (20%), rule #CFC3A8 and muted #6E6455 (structure), seal red #A3201B (10% max, one job: sealed state, the primary action, and the one fill price).
- No other hues. No gradients, no shadows, no noise.

## Space and shape
- 4 px base, steps 4/8/12/16/24/32/48/64.
- Radius 0 everywhere. Borders 1px rule, 1px ink for table heads, 3px ink for the masthead and section breaks.

## Components
- Masthead: wordmark left, links and wallet right on one line, 3px rule, edition line. Not centred.
- Ledger table (signature): № in old-style display numerals, token as a black redaction bar that types in over 400ms on reveal.
- Flat one-colour seal stamp (SVG strokes, no fill gradient); it cracks at reveal.
- Timeline commit -> deposit -> reveal as a ruled three-step register.
- Serif number ticker for tokens out.

## Motion
One orchestrated moment: the reveal (stamp strikes 300ms, token types in 400ms, figures tick 600ms, rows fade in 90ms stagger). Everything else 150ms colour transitions. All of it off under prefers-reduced-motion.

## Refusals
Cards, card grids, I/II/III feature rows, stat trios, status pills, mono caps labels, gradients, drop shadows, radial glows, centred hero, empty loading states (the ledger opens from a seeded devnet snapshot), emoji, em dashes in copy.
