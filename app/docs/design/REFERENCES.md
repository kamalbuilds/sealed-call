# SEALED CALL: references and DNA cards

Method: `hallmark study` (URL mode, ~/.agents/skills/hallmark/references/study.md) on each URL, with the CSS signal taken from computed styles. The study's URL mode asks for WebFetch of HTML and CSS, but WebFetch returns markdown only, so computed tokens were captured with `docs/design/tools/refshot-pw.py` instead. That script is a Playwright port of ui-craft's `scripts/refshot.py`, needed because the bhn deepsurge tab produced no output on this Mac. It uses refshot.py's own TOKENS_JS and junk refusal. Because I had the screenshots, rhythm is judged from the image, so each card is a URL plus image hybrid. Ten more references are in `design-research/REFS.md`.

## Paradigm research post: ref-paradigm-1440.png
URL: https://www.paradigm.xyz/2024/06/priority-is-all-you-need · files: ref-paradigm-1440.png, ref-paradigm-390.png, ref-paradigm-tokens.json

I read the URL. The page is a **02 Long Document**. The hero is a centred title band with no lede and no CTA. Nav is a minimal centred wordmark ("Paradigm / Writing", 28px serif) with a single [M] key. The footer is footnotes, then a plain list.
The page loads **Paradigm Serif** for display and body, and **Paradigm SemiMono** for labels. Roles: book serif display (h1 38px/400, tracking -1.14px, leading 41.8px; h2 21px, tracking -0.42px) plus a semi-mono label face (12px, tracking +0.24px).
The paper is white (computed transparent over #fff). The ink is #000. There is no accent; emphasis is italic and underline.
Motion: no motion library. Reveal: none.
Rhythm: the text column sits right of centre at about 600px, the contents rail and byline sit in a left margin, and the page reads asymmetric and sparse.
Anti-patterns in CSS or scripts: none. The one 12px pill is the only radius.
DNA taken: Long Document skeleton, margin apparatus, numbered footnotes, a negative-tracked serif display, no accent colour for structure.
DNA refused: the centred h1, and mono as a label voice.

## Christie's auction results: ref-christies-1440.png
URL: https://www.christies.com/en/results · files: ref-christies-1440.png, ref-christies-390.png, ref-christies-tokens.json

I read the URL. The page is a **13 Index-First** results index. The hero is a centred title with a one-line lede. Nav is a wordmark on the left with an uppercase department row. The footer was not captured (cookie bar).
The page loads **arizonaSerif** for display and **arizonaSans** for body. Roles: light didone-like serif display (h1 48px/300, leading 57.6px; h3 24px/300) plus a light grotesque body (16px/300).
The paper is white. The accent is a dark red bar (4px) marking the current month in the left rail, plus black for "CLOSED" labels. Accent footprint is under 1%.
Motion: no motion library detected in the computed styles. Reveal: none.
Rhythm: a left index rail (month list) beside a two-column tile grid; asymmetric left-heavy.
Anti-patterns: pill buttons with 24px radius, and an image-tile card grid.
DNA taken: a light-weight high-contrast serif for display, one red mark for the "current" row, filters as ruled underlines, and lot listings as an index.
DNA refused: tiles and pills.

## gwern.net sidenotes essay: ref-gwern-1440.png
URL: https://gwern.net/sidenote · files: ref-gwern-1440.png, ref-gwern-390.png, ref-gwern-tokens.json

I read the URL. The page is a **02 Long Document** with sidenotes. The hero is a small-caps title with an italic abstract and a metadata line. Nav is a row of bordered boxes. The footer is backlinks and a bibliography.
The page loads **Source Serif 4** for display and body, **Source Sans 3** for UI, and **IBM Plex Mono** for code. Roles: book serif display (h1 50px/600, tracking -1px, small caps) plus the same serif for body, with old-style figures.
The paper is #fff. The ink is #000. There is no accent; borders are 1px #ccc.
Motion: popups on hover (JS). No reveal animation.
Rhythm: a TOC box on the left, the text column in the centre, and sidenotes in the right margin; dense.
Anti-patterns: chrome density (an icon rail on the right).
DNA taken: Source Serif 4 as the body, old-style figures, and transaction signatures as sidenotes aligned in the right margin.
DNA refused: the boxed nav and icon rail.

## Combined DNA applied to SEALED CALL (see ../../DESIGN.md)
- **Macrostructure:** 02 Long Document, with a ledger table as the one data block. A 720px column plus a 240px right margin for notes.
- **Type:** Bodoni Moda display. It replaces Fraunces, which uicraft gate bans, and stands in for Christie's light didone and Paradigm's negative tracking. Source Serif 4 body (gwern), JetBrains Mono for hashes only.
- **Colour:** paper #EFE6D2, ink #1C1A17, one red #A3201B used the way Christie's uses its rail mark.
- **Nav:** wordmark on the left, links and wallet on the right, a 3px rule, and an edition line (FT and Christie's masthead voice). Not centred.
