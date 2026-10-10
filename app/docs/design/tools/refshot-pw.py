#!/usr/bin/env python3
"""refshot-pw.py URL OUT.png W H [--full]
Playwright fallback for ui-craft's scripts/refshot.py (its bhn deepsurge tab produced no output on this Mac).
Reuses refshot.py's TOKENS_JS and BAD_TEXT verbatim, the same junk refusal (exit 2) and luma-stddev blank check,
and writes OUT.tokens.json beside the PNG. Viewport capture is exactly W px wide."""
import ast, io, json, os, re, sys
from PIL import Image, ImageStat
from playwright.sync_api import sync_playwright

src = open(os.path.expanduser("~/.agents/skills/ui-craft/scripts/refshot.py")).read()
TOKENS_JS = re.search(r'TOKENS_JS = r"""(.*?)"""', src, re.S).group(1)
BAD_TEXT = ast.literal_eval(re.search(r"BAD_TEXT = (\(.*?\))\n", src, re.S).group(1))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
url, out, W, H = args[0], args[1], int(args[2]), int(args[3])
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=1,
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36")
    pg.goto(url, wait_until="load", timeout=45000)
    try: pg.wait_for_load_state("networkidle", timeout=8000)
    except Exception: pass
    pg.evaluate("document.fonts.ready.then(()=>1)"); pg.wait_for_timeout(1500)
    tok = pg.evaluate(TOKENS_JS)
    text = (tok.get("bodyText") or "").lower() + " " + (tok.get("title") or "").lower()
    bad = [t for t in BAD_TEXT if t in text and t != "404"]
    if bad or tok.get("textLen", 0) < 80:
        print(f"REFUSED {url}: {bad or 'too little text'}"); sys.exit(2)
    png = pg.screenshot(full_page="--full" in sys.argv)
    if ImageStat.Stat(Image.open(io.BytesIO(png)).convert("L")).stddev[0] < 6:
        print(f"REFUSED {url}: blank frame"); sys.exit(2)
    open(out, "wb").write(png)
    json.dump({"url": url, "viewport": [W, H], **tok}, open(re.sub(r"\.png$", "-tokens.json", out) if "-tokens" not in out else out + ".json", "w"), indent=1)
    print("ok", out, Image.open(io.BytesIO(png)).size, tok.get("title"))
    b.close()
