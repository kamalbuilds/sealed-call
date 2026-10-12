#!/usr/bin/env python3
"""overlap-check.py [BASE] [--shots DIR]: scroll every route step by step at 1440/768/390 and fail if any two
visible text boxes intersect where both are painted (nothing opaque on top). Exit 1 on any overlap."""
import os, sys, json
from playwright.sync_api import sync_playwright
args = [a for a in sys.argv[1:] if not a.startswith("--")]
BASE = (args[0] if args else os.environ.get("BASE", "https://sealed-call.pages.dev")).rstrip("/")
SHOTS = sys.argv[sys.argv.index("--shots") + 1] if "--shots" in sys.argv else None
ROUTES = {"home": "/", "try": "/try/", "open": "/open/", "call": "/call/?c=HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3"}
WIDTHS = [(1440, 900), (768, 1024), (390, 844)]
JS = r"""() => {
  const out = [], vh = innerHeight, vw = innerWidth;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const items = [];
  while (w.nextNode()) {
    const t = w.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || +cs.opacity === 0 || el.closest("[aria-hidden=true]") || cs.color === "transparent") continue;
    const r = document.createRange(); r.selectNodeContents(t);
    for (const b of r.getClientRects()) {
      if (b.width < 2 || b.height < 2 || b.bottom <= 0 || b.top >= vh || b.right <= 0 || b.left >= vw) continue;
      items.push({ el, b, txt: t.textContent.trim().slice(0, 40) });
    }
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const A = items[i], B = items[j]; if (A.el === B.el) continue;
    const x1 = Math.max(A.b.left, B.b.left), x2 = Math.min(A.b.right, B.b.right), y1 = Math.max(A.b.top, B.b.top), y2 = Math.min(A.b.bottom, B.b.bottom);
    if (x2 - x1 < 3 || y2 - y1 < 3) continue;
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2; if (cy < 0 || cy >= vh) continue;
    const hit = document.elementFromPoint(cx, cy); if (!hit) continue;
    const onA = A.el.contains(hit) || hit.contains(A.el), onB = B.el.contains(hit) || hit.contains(B.el);
    if (!onA && !onB) continue; // something opaque covers the spot
    // the top element hides the other only if it paints a background
    const top = onA ? A.el : B.el; let n = hit, opaque = false;
    while (n && n !== document.body) { const bg = getComputedStyle(n).backgroundColor; if (bg && bg !== "transparent" && !bg.endsWith(", 0)")) { opaque = !(n.contains(A.el) && n.contains(B.el)); break; } n = n.parentElement; }
    if (opaque) continue;
    out.push({ a: A.txt, b: B.txt, x: Math.round(cx), y: Math.round(cy) });
  }
  return out;
}"""
fails = []
SELFTEST = '<body style="background:#000;color:#fff"><div style="position:relative"><span>Hello overlapping words</span><span style="position:absolute;left:10px;top:2px">Second text here</span></div></body>'
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True)
    t = br.new_page(); t.set_content(SELFTEST)
    if not t.evaluate(JS): print("overlap-check: SELFTEST FAILED (detector missed a planted overlap)"); sys.exit(2)
    print("selftest: planted overlap detected"); t.close()
    for w, h in WIDTHS:
        pg = br.new_page(viewport={"width": w, "height": h})
        for name, path in ROUTES.items():
            pg.goto(BASE + path, wait_until="load", timeout=60000); pg.wait_for_timeout(9000 if name == "call" else 6000)
            total = pg.evaluate("document.documentElement.scrollHeight"); y, step = 0, int(h * 0.6); k = 0
            while True:
                pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(350)
                for o in pg.evaluate(JS): fails.append({"route": name, "width": w, "scrollY": y, **o})
                if SHOTS: os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=f"{SHOTS}/{name}-{w}-s{k:02d}.png")
                if y + h >= total: break
                y += step; k += 1
            print(f"{name:5} {w:4}: {k + 1} scroll steps, height {total}", flush=True)
        pg.close()
    br.close()
uniq = {(f["route"], f["width"], f["a"], f["b"]): f for f in fails}
for f in uniq.values(): print("OVERLAP", json.dumps(f))
print(f"overlap-check: {'PASS' if not uniq else f'{len(uniq)} overlap(s)'}")
sys.exit(1 if uniq else 0)
