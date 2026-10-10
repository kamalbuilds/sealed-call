# SEALED CALL: component picks (uicraft search / 21st)

| Need | Pick | Source | How it was adapted |
| --- | --- | --- | --- |
| Ledger table (signature component) and fill register | shadcn/ui Table | `uicraft code shadcn/table`, https://ui.shadcn.com/docs/components/table | Copied into `components/ui/table.tsx`. I kept the forwardRef primitives and the overflow wrapper and swapped every Tailwind token for the ledger classes in globals.css: 1px ink head rule, rule-coloured row rules, no zebra, no muted footer. Used on `/` (the ledger) and on `/call` (the fill register). |
| Tokens-out and price figures | Number Ticker (dillionverma) | https://21st.dev/r/dillionverma/number-ticker (found with `uicraft 21st "number ticker"`) | I re-implemented the count-up in `components/ticker.tsx` with requestAnimationFrame instead of motion/react, which saves a dependency for one ease. It uses an out-expo ease clamped to zero, so the figure can never read negative, renders in the Bodoni display at old-style figures, and is static under prefers-reduced-motion. |
| Wallet connect | @solana/wallet-adapter-react-ui | https://github.com/anza-xyz/wallet-adapter | Flattened in globals.css: radius 0, 1px ink outline, no icon, serif label. |
| Seal stamp, redaction bar, timeline | Bespoke | none | FALLBACK: none of the 21st.dev "stamp", "badge" or "stepper" results were flat or one-colour or square. They were rounded, gradient or pill styled, so these three are bespoke SVG and CSS using the DESIGN.md tokens. |

Rejected after search: `uicraft search table` also returned beautifului/records-table and aceternity/ribbon-gradient-shader. Both are card and gradient styled and on the refusal list. The 21st "Stats Widget" is a card plus big-metric template, also refused.
