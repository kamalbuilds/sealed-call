#!/usr/bin/env python3
"""shots.py BASE OUTDIR PREFIX : viewport shots of /, /call (recorded reveal), /open at 1440x900 and 390x844 (+ full-page)."""
import sys, os
from playwright.sync_api import sync_playwright
base, out, pre = sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3]
CALL = "HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3"
pages = {"home": "/", "call": f"/call/?c={CALL}", "open": "/open/"}
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for w, h in ((1440, 900), (390, 844)):
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        for name, path in pages.items():
            pg.goto(base + path, wait_until="load", timeout=45000); pg.wait_for_timeout(10000 if name == "call" else 5000)
            ow = pg.evaluate("document.documentElement.scrollWidth")
            tag = f"{pre}-{w}.png" if name == "home" else f"{pre}-{name}-{w}.png"
            pg.screenshot(path=os.path.join(out, tag))
            pg.screenshot(path=os.path.join(out, tag.replace(".png", "-full.png")), full_page=True)
            print(name, w, "scrollWidth", ow, tag)
        pg.close()
    b.close()
