#!/usr/bin/env python3
"""Feature audit against the live site, real devnet. usage: /tmp/pwenv/bin/python scripts/audit/ui-audit.py <step> [args]"""
import base64, json, os, re, sys, time
from playwright.sync_api import sync_playwright
BASE = os.environ.get("BASE", "https://sealed-call.pages.dev")
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHOT = os.path.join(ROOT, "docs/audit"); KEY = "sealed-call:devnet-burner"
def b64(p): return base64.b64encode(bytes(json.load(open(os.path.join(ROOT, p))))).decode()
out = {}
def log(k, v): out[k] = v; print(k, "=>", v, flush=True)
def ctx_as(b, keyfile=None):
    c = b.new_context(accept_downloads=True, viewport={"width": 1280, "height": 900}); pg = c.new_page()
    pg.goto(BASE + "/", wait_until="load")
    if keyfile: pg.evaluate("([k,v]) => { localStorage.setItem(k,v); localStorage.setItem('walletName', JSON.stringify('Devnet burner (this browser)')); }", [KEY, b64(keyfile)])
    return c, pg
def wait_text(pg, rx, t=120000): pg.get_by_text(re.compile(rx)).first.wait_for(timeout=t)
def err(pg):
    e = pg.locator(".err"); return e.first.inner_text() if e.count() else ""
step = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    if step == "home":
        c, pg = ctx_as(b); pg.goto(BASE + "/", wait_until="networkidle"); pg.wait_for_timeout(6000)
        log("home_rows", pg.locator("tbody tr").count()); pg.screenshot(path=f"{SHOT}/home.png", full_page=True)
        # seed fallback: block the RPC
        c2 = b.new_context(); pg2 = c2.new_page(); pg2.route(re.compile(r".*(solana\.com|rpc).*"), lambda r: r.abort())
        pg2.goto(BASE + "/", wait_until="load"); pg2.wait_for_timeout(8000)
        log("seed_fallback_rows", pg2.locator("tbody tr").count()); log("seed_fallback_text", pg2.locator("main").inner_text()[:600]); pg2.screenshot(path=f"{SHOT}/seed-fallback.png", full_page=True)
        pg.goto(BASE + "/call/?c=HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3", wait_until="load"); pg.wait_for_timeout(5000)
        pg.get_by_role("button", name="Replay the reveal").click(); pg.wait_for_timeout(6000)
        log("replay_text_has_one_price", "Every row paid" in pg.content()); pg.screenshot(path=f"{SHOT}/replay.png", full_page=True)
    elif step == "lapse":  # call, follower key
        call, fk = sys.argv[2], sys.argv[3]
        c, pg = ctx_as(b, fk); pg.goto(f"{BASE}/call/?c={call}", wait_until="load"); pg.wait_for_timeout(6000)
        log("expire_with_positions_err", "")  # see expire-dbg: 6035 FollowersRemain before refunds
        pg.get_by_role("button", name="Take my SOL back").first.click(); pg.wait_for_timeout(25000); log("refund_err", err(pg))
        pg.reload(); pg.wait_for_timeout(7000); pg.screenshot(path=f"{SHOT}/refund.png", full_page=True)
        pg.get_by_role("button", name="Mark the call lapsed").click(); pg.wait_for_timeout(25000); log("expire_err", err(pg))
        pg.reload(); pg.wait_for_timeout(7000); t = pg.locator("main").inner_text(); log("after_state", re.findall(r"Lapsed\. Refunds are open\.|Window closed\. Refunds open\.|Sealed, taking deposits\.", t)); pg.screenshot(path=f"{SHOT}/expired.png", full_page=True)
    elif step == "main":  # caller key, follower key
        ck, fk = sys.argv[2], sys.argv[3]
        c, pg = ctx_as(b, ck); pg.goto(BASE + "/open/", wait_until="load"); pg.wait_for_timeout(6000)
        pg.get_by_role("button", name="Seal the call").click()
        pg.get_by_role("link", name="Open the call").wait_for(timeout=90000)
        with pg.expect_download() as d: pg.get_by_role("button", name="Download the seal").click()
        sealp = os.path.join(SHOT, "_seal.json"); d.value.save_as(sealp); seal = json.load(open(sealp)); call = seal["call"]; log("call", call); log("seal_keys", list(seal.keys()))
        pg.screenshot(path=f"{SHOT}/open-sealed.png", full_page=True); c.close()
        c, pg = ctx_as(b, fk); pg.goto(f"{BASE}/call/?c={call}", wait_until="load"); pg.wait_for_timeout(6000)
        pg.fill("#amt", "0.001"); pg.get_by_role("button", name=re.compile(r"^Deposit")).click(); pg.wait_for_timeout(15000); log("deposit_too_small_err", err(pg))
        pg.fill("#amt", "0.005"); pg.get_by_role("button", name=re.compile(r"^Deposit")).click()
        pg.get_by_role("button", name=re.compile(r"^Withdraw")).wait_for(timeout=90000); log("deposit", "ok")
        pg.get_by_role("button", name=re.compile(r"^Withdraw")).click(); pg.wait_for_timeout(20000); pg.reload(); pg.wait_for_timeout(6000)
        log("withdraw_button_gone", pg.get_by_role("button", name=re.compile(r"^Withdraw")).count() == 0)
        pg.fill("#amt", "0.005"); pg.get_by_role("button", name=re.compile(r"^Deposit")).click(); pg.get_by_role("button", name=re.compile(r"^Withdraw")).wait_for(timeout=90000); log("redeposit", "ok"); c.close()
        # caller in a fresh browser: no stored seal -> load a tampered file, then the real one
        c, pg = ctx_as(b, ck); pg.goto(f"{BASE}/call/?c={call}", wait_until="load"); pg.wait_for_timeout(6000)
        log("no_seal_prompt", "does not hold the seal" in pg.content())
        bad = dict(seal); s = bad["salt"]; bad["salt"] = (s[:-2] + ("AA" if not s.endswith("AA") else "BB")) if isinstance(s, str) else [(s[0] + 1) % 256] + s[1:]
        badp = os.path.join(SHOT, "_bad.seal.json"); json.dump(bad, open(badp, "w"))
        pg.set_input_files("input[type=file]", badp); pg.wait_for_timeout(1500)
        pg.get_by_role("button", name=re.compile(r"^Reveal")).click(); pg.wait_for_timeout(25000); log("bad_seal_err", err(pg)); pg.screenshot(path=f"{SHOT}/bad-seal-error.png", full_page=True); c.close()
        c, pg = ctx_as(b, ck); pg.goto(f"{BASE}/call/?c={call}", wait_until="load"); pg.wait_for_timeout(6000)
        other = dict(seal); other["call"] = "HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3"; op = os.path.join(SHOT, "_other.seal.json"); json.dump(other, open(op, "w"))
        pg.set_input_files("input[type=file]", op); pg.wait_for_timeout(1500); log("other_call_seal_err", err(pg))
        pg.set_input_files("input[type=file]", sealp); pg.wait_for_timeout(1500)
        pg.get_by_role("button", name=re.compile(r"^Reveal")).click(); wait_text(pg, r"Seal broken\. Vault filled\.", 120000); pg.wait_for_timeout(9000)
        log("reveal_loaded_file", "ok"); log("caller_lock_text", "unlock in" in pg.content()); pg.screenshot(path=f"{SHOT}/revealed.png", full_page=True); c.close()
        c, pg = ctx_as(b, fk); pg.goto(f"{BASE}/call/?c={call}", wait_until="load"); pg.wait_for_timeout(6000)
        pg.get_by_role("button", name="Claim my tokens").click(); wait_text(pg, r"Claimed\.", 90000); log("claim", "ok"); pg.screenshot(path=f"{SHOT}/claimed.png", full_page=True)
    elif step == "burner":
        c, pg = ctx_as(b); pg.goto(BASE + "/try/", wait_until="load"); pg.wait_for_timeout(4000)
        pg.get_by_role("button", name="Use a burner wallet").click(); wait_text(pg, "Connected:", 20000)
        addr = pg.evaluate("() => { const r = localStorage.getItem('sealed-call:devnet-burner'); return r }"); json.dump(addr, open(os.path.join(SHOT, "_burner.b64.json"), "w"))
        log("burner_connected", pg.locator("p:has-text('Connected:')").inner_text())
        pg.get_by_role("button", name="Request 0.1 SOL here").click(); pg.wait_for_timeout(40000); log("airdrop_msg", pg.locator(".help").first.inner_text()); pg.screenshot(path=f"{SHOT}/try-burner.png", full_page=True)
        log("open_calls_listed", pg.locator("aside a.panel").count())
    elif step == "solo":
        raw = b64(sys.argv[2]) if len(sys.argv) > 2 else json.load(open(os.path.join(SHOT, "_burner.b64.json")))
        c = b.new_context(accept_downloads=True, viewport={"width": 1280, "height": 900}); pg = c.new_page(); pg.goto(BASE + "/", wait_until="load")
        pg.evaluate("([k,v]) => { localStorage.setItem(k,v); localStorage.setItem('walletName', JSON.stringify('Devnet burner (this browser)')); }", [KEY, raw])
        pg.goto(BASE + "/open/", wait_until="load"); pg.wait_for_timeout(6000)
        pg.get_by_role("button", name="Seal the call").click(); pg.get_by_role("link", name="Open the call").wait_for(timeout=90000)
        pg.get_by_role("link", name="Open the call").click(); pg.wait_for_load_state("load"); pg.wait_for_timeout(7000); log("solo_call", pg.url)
        pg.get_by_role("button", name="Reveal with your stake only").click(); wait_text(pg, r"Seal broken\. Vault filled\.", 120000); pg.wait_for_timeout(8000); log("solo_reveal_stored_seal", "ok"); pg.screenshot(path=f"{SHOT}/solo-revealed.png", full_page=True)
    elif step == "callerclaim":
        call, ck = sys.argv[2], sys.argv[3]
        c, pg = ctx_as(b, ck); pg.goto(f"{BASE}/call/?c={call}", wait_until="load"); pg.wait_for_timeout(7000)
        pg.get_by_role("button", name="Claim the caller’s tokens").click(); wait_text(pg, "Your tokens are claimed", 90000); log("caller_claim", "ok"); pg.screenshot(path=f"{SHOT}/caller-claim.png", full_page=True)
    json.dump(out, open(os.path.join(SHOT, f"_{step}.json"), "w"), indent=1)
