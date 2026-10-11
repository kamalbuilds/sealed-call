# SEALED CALL design contract: dashboard ledger (supersedes the Notary's ledger print look)

System: `clickhouse` from ~/.config/design-md/INDEX.md (near-black canvas, one electric-yellow voltage, yellow stat numbers, hairline-bordered cards). Chosen because SEALED CALL is a live on-chain ledger: a dark data surface with big stat figures reads as a trading dashboard, not a document.

1. Direction: dark dashboard ledger. Top strip of summary metrics (large numbers, small labels), status as colored chips, the ledger as a bordered card holding a styled table (row hover, mono truncated addresses with explorer links), one yellow primary action per screen. No cream, no Bodoni, no Source Serif, no print rules.
2. Fonts: Space Grotesk (display + UI, 400/500/600/700) and JetBrains Mono (addresses, hashes, amounts), both via next/font/google (https://fonts.google.com/specimen/Space+Grotesk, https://fonts.google.com/specimen/JetBrains+Mono). Inter from the source system is swapped for Space Grotesk; no serif anywhere.
3. Palette (CSS variables in app/globals.css): see token block. One accent (yellow) plus semantic success/warn/danger and a blue info tone for "open".
4. Spacing: 4px base, scale 4/8/12/16/24/32/48/64. Radius 6px controls, 10px cards, 999px chips.
5. Layout: max-width 1200px shell; header bar, metric strip (4 tiles), primary content card. Call page: state header + metric strip + action panel (right column at >=1024) + register table. Open page: two-column form card + summary rail.

## Type scale
12 (caption, uppercase labels 0.08em) / 14 (body-sm, table) / 16 (body) / 20 (title) / 28 (section) / 40 (stat + page title). Tabular numerals everywhere numbers appear.

## Token block
```css
:root {
  --canvas: #0a0a0a;
  --surface: #121212;
  --surface-card: #1a1a1a;
  --surface-elevated: #242424;
  --hairline: #2a2a2a;
  --hairline-strong: #3a3a3a;
  --ink: #ffffff;
  --body: #cccccc;
  --muted: #888888;
  --primary: #faff69;
  --primary-active: #e6eb52;
  --on-primary: #0a0a0a;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;
  --radius-sm: 6px;
  --radius: 10px;
  --shadow-card: 0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35);
}
```

## Status chips
Open (blue, countdown) / Filled (green) / Lapsed, refundable (amber) / Expired (grey). Always text plus color.

## Refusals
Cream paper, serif faces, newspaper masthead, footnote margins, № numbering, walls of prose, gradient text, backdrop blur, glows, rounded-2xl+, emoji, em dashes.
