# SEALED CALL references (captured 2026-10-10 with docs/design/tools/refshot-pw.py; tokens in refs/*-tokens.json)

North star: Paradigm research post. Secondaries: Christie's results, gwern/Tufte sidenotes. Domain refs (auction houses, Solana explorers and memecoin venues) are listed with what NOT to take.

## Paradigm: "Priority Is All You Need" (research post, outside domain, north star)
Screen: a long research article. The move: one text column (about 600px of 1440, offset right) with the contents list and byline in the left margin, h1 Paradigm Serif 38px weight 400 tracking -1.14px leading 41.8px, h2 21px tracking -0.42px, metadata in Paradigm SemiMono 12px tracking 0.24px, pure black on white, radius 0 except a 12px [M] menu pill. Numbers: dates in mono 12px, footnote markers as superscripts linking to a list at the end. Empty state: none, it is a document. Primary action: none on the page; navigation is keyboard letters [L] [S]. Take: the margin apparatus and the restraint (no colour at all). Not take: the mono labels (our direction caps mono at hashes only), the centred h1.
PNG: refs/paradigm-1440.png, refs/paradigm-390.png

## gwern.net: "Sidenotes In Web Design" (essay, outside domain)
Screen: an essay whose subject is the margin note. The move: h1 Source Serif 4 50px weight 600 tracking -1px small caps, body Source Serif 4 at about 17px justified, a left TOC rail in Source Sans 3 and a bordered 1px #ccc main column; sidenotes sit in the right margin aligned to their anchor. Metadata line uses old-style figures and tiny glyph links. Take: Source Serif 4 as the body (we already use it), old-style figures in prose, sidenote alignment for tx signatures. Not take: the dense chrome (right tool rail of icons), dotted nav boxes, bordered panels.
PNG: refs/gwern-1440.png, refs/gwern-390.png

## Tufte CSS (style sheet demo, outside domain)
Screen: the reference implementation of margin notes. The move: et-book h1 48px weight 400, p measured 27px at 1440 (the root font scales with the viewport); text column about 55% of the page with the right 45% left empty for sidenotes; background #fffff8 cream, ink rgb(17,17,17). Take: the empty right margin as an intentional column, cream paper rather than white, no rules at all between paragraphs. Not take: the oversized body size on desktop, and et-book itself (Tufte's signature, would read as a copy).
PNG: refs/tufte-1440.png, refs/tufte-390.png

## Christie's: Auction results (domain: auctions, secondary)
Screen: results index with a month rail and lot tiles. The move: h1 arizonaSerif 48px weight 300 leading 57.6px, body arizonaSans 16px weight 300, a left month list (October in 21px serif with a 4px red bar, other months grey), filters as underlined fields with 1px rules rather than boxes. Numbers: year "2026" small right-aligned in the rail; "CLOSED" as a small boxed label. Primary action: outlined pill buttons radius 24px. Take: the light-weight serif display, the single red mark for the current item, filters as ruled underlines. Not take: image tiles and pill buttons (we are radius 0 and have no imagery), the centred hero.
PNG: refs/christies-1440.png, refs/christies-390.png

## Sotheby's: Auction results (domain: auctions)
Screen: past auctions as a list with a left filter column. The move: h1 MercuryDisplay 40px weight 500, list rows with a 150px image, title in serif 22px, date line in BentonSans 14px uppercase tracking 1px, a ruled filter column (DATE, LOCATION) with 1px rules between groups, square 0px radius buttons. Numbers: "SHOWING 7,910 RESULTS" as a count above filters. Take: square buttons, the ruled filter column, the date line under each title. Not take: uppercase tracked labels on every element (our checklist allows one per screen), the grey hero band.
PNG: refs/sothebys-1440.png, refs/sothebys-390.png

## FT Markets Data: Equities (outside domain, data table)
Screen: market movers table under the FT masthead. The move: FinancierDisplay h1 40px weight 400 on the salmon #FFF1E5 family, MetricWeb 16px body, a 4px black rule above each module title, table rows with name in claret, ticker beneath in 11px grey, change figures right-aligned. Take: thick rule above each section title, two-line table cells (name over code), right-aligned figures. Not take: FT salmon (ours is the specified paper #EFE6D2), green/red change colours (we have one accent only), the ad-dense layout. Capture includes the cookie modal; the table is visible around it.
PNG: refs/ftmarkets-1440.png, refs/ftmarkets-390.png

## Our World in Data: grapher (outside domain, "data with a source")
Screen: a chart page whose every figure cites its source. The move: Playfair Display h1 25px weight 600 over Lato 15px #5b5b5b, chart framed only by axis lines, a "Source:" footer line and tabbed views (Table / Chart / Map) as flat text tabs. Take: the source line as a first-class element (our footnoted tx signatures play this role), flat text tabs. Not take: Playfair (cliché display serif), the blue UI chrome.
PNG: refs/owid-1440.png, refs/owid-390.png

## Solana Explorer: the recorded reveal transaction (domain: on-chain proof)
Screen: transaction 3TiDGb...jbj3bhdJ, the real reveal of call HaaRa...Etnw3. The move: Rubik h1 "Transaction" 30px tracking -0.6px, a summary table with label column at about 150px and monospace values (signature, fee payer, slot 507,691,251, CUs 109,404 / 400,000, 852 bytes), green "Success" pill. Take: the facts we cite in footnotes (slot, CU, bytes) and label/value rows. Not take: dark theme, teal accent, pills, the boxed panel with 8px radius.
PNG: refs/solexplorer-1440.png, refs/solexplorer-390.png

## DEX Screener: Solana pairs (domain: memecoin trading)
Screen: dense dark pairs table. The move: Poppins 11px rows, 14px weight 600 tabs, radius 6px buttons, rows of price, age, txns, volume, change columns with green/red. Take: nothing visual; the column set confirms traders expect age and volume next to a token, so our ledger shows vault SOL and time opened. Not take: dark terminal, colour-coded change, ad banners: this is the negative pole of the brief.
PNG: refs/dexscreener-1440.png, refs/dexscreener-390.png

## pump.fun board (domain: memecoin launch)
Screen: the coin board where calls get acted on. The move: Geist 14px, card grid with coin image, green 10px-radius buttons, market cap in bold 24px. Take: the information a follower wants per call (creator, market cap, time) maps to our caller, vault and time columns. Not take: card grid, green-on-black, images, live ticker motion. This is the slop we are positioning against.
PNG: refs/pumpfun-1440.png, refs/pumpfun-390.png

## Meteora app (domain: the swap venue, DAMM v2)
Screen: Meteora home, the venue the reveal swaps through. The move: Inter 16px weight 500 on dark #0b0b1a, pill buttons radius 9999px, purple-tinted greys rgb(108,108,137). Take: naming only (we cite "Meteora DAMM v2" in copy and margin). Not take: Inter, purple greys, pills; all three are on our refusal list.
PNG: refs/meteora-1440.png, refs/meteora-390.png

## Jupiter (domain: Solana swap)
Screen: swap home. The move: Inter 12-16px in oklch(0.929 0.013 255.5) on near-black, fully rounded controls (radius 3.3e7px), one big swap card. Take: a single primary action per screen. Not take: everything else (Inter, rounded card, dark blue palette).
PNG: refs/jupiter-1440.png, refs/jupiter-390.png
