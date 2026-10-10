#!/usr/bin/env python3
"""Record the demo on the live site against real devnet (Playwright video, 1440x900).
Two funded devnet keypairs (keys/demo/caller.json, keys/demo/follower.json) are loaded into the site's
burner wallet by writing them to localStorage; every transaction is signed and sent for real.
usage: /tmp/pwenv/bin/python scripts/record-demo.py [base]  -> docs/pitch/demo.webm"""
import base64, json, os, re, shutil, sys, time
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "https://sealed-call.pages.dev").rstrip("/")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = "sealed-call:devnet-burner"
def b64(path): return base64.b64encode(bytes(json.load(open(os.path.join(ROOT, path))))).decode()
CALLER, FOLLOWER = b64("keys/demo/caller.json"), b64("keys/demo/follower.json")
log = []
def mark(s): log.append((round(time.time() - T0, 1), s)); print(log[-1], flush=True)

def as_(page, secret, url):
    page.evaluate("([k, v]) => { localStorage.setItem(k, v); localStorage.setItem('walletName', JSON.stringify('Devnet burner (this browser)')); }", [KEY, secret])
    page.goto(url, wait_until="load"); page.wait_for_timeout(2500)

def glide(page, y, steps=30):
    page.mouse.wheel(0, y); page.wait_for_timeout(1200)

with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    vid = os.path.join(ROOT, "docs/pitch/_rec"); os.makedirs(vid, exist_ok=True)
    ctx = b.new_context(accept_downloads=True, viewport={"width": 1440, "height": 900}, record_video_dir=vid, record_video_size={"width": 1440, "height": 900})
    page = ctx.new_page(); T0 = time.time()
    # 1. home
    page.goto(BASE + "/", wait_until="load"); mark("home"); page.wait_for_timeout(7000)
    glide(page, 500); page.wait_for_timeout(5000); glide(page, 600); page.wait_for_timeout(5000)
    page.mouse.wheel(0, -3000); page.wait_for_timeout(1500)
    rec = "HaaRaA1TCG3YMHu8vCtoCr5jkrdgUP5PjjUJnUsEtnw3"
    page.goto(BASE + "/call/?c=" + rec, wait_until="load"); mark("recorded call"); page.wait_for_timeout(4000)
    page.mouse.wheel(0, 650); page.wait_for_timeout(1000)
    page.get_by_role("button", name="Replay the reveal").click(); mark("replay"); page.wait_for_timeout(5000)
    page.mouse.wheel(0, -2000); page.wait_for_timeout(4000)
    # 2. caller seals a call
    as_(page, CALLER, BASE + "/open/"); mark("open page as caller"); page.wait_for_timeout(5000)
    page.get_by_role("button", name="Seal the call").click(); mark("seal clicked")
    page.get_by_role("link", name="Open the call").wait_for(timeout=90000); mark("sealed"); page.wait_for_timeout(3000)
    with page.expect_download() as d: page.get_by_role("button", name="Download the seal").click()
    mark("seal file downloaded"); page.wait_for_timeout(4000)
    page.get_by_role("link", name="Open the call").click(); page.wait_for_load_state("load"); page.wait_for_timeout(6000)
    call_url = page.url; mark("call page sealed " + call_url)
    page.wait_for_timeout(6000); glide(page, 500); page.wait_for_timeout(6000); page.mouse.wheel(0, -2000)
    # 3. follower deposits
    as_(page, FOLLOWER, call_url); mark("follower view"); page.wait_for_timeout(4000)
    page.mouse.wheel(0, 900); page.wait_for_timeout(2000)
    page.fill("#amt", "0.01"); page.wait_for_timeout(1200)
    page.get_by_role("button", name=re.compile(r"^Deposit")).click(); mark("deposit clicked")
    page.get_by_text(re.compile(r"Your deposit|Withdraw")).first.wait_for(timeout=90000); mark("deposited"); page.wait_for_timeout(3000)
    page.mouse.wheel(0, -500); page.wait_for_timeout(3000); page.mouse.wheel(0, 500); page.wait_for_timeout(1000)
    page.get_by_role("button", name=re.compile(r"^Withdraw")).hover(); mark("hover withdraw"); page.wait_for_timeout(4000)
    # 4. caller reveals
    as_(page, CALLER, call_url); mark("caller back"); page.mouse.wheel(0, 900); page.wait_for_timeout(3000)
    page.get_by_role("button", name=re.compile(r"^Reveal")).click(); mark("reveal clicked")
    page.get_by_text("The seal is broken.").wait_for(timeout=120000); mark("revealed")
    page.mouse.wheel(0, -3000); page.wait_for_timeout(12000); glide(page, 700); page.wait_for_timeout(9000); glide(page, 700); page.wait_for_timeout(6000)
    # 5. follower claims
    as_(page, FOLLOWER, call_url); mark("follower claim view"); page.mouse.wheel(0, 1200); page.wait_for_timeout(3000)
    page.get_by_role("button", name="Claim my tokens").click(); mark("claim clicked")
    page.get_by_text("Claimed. The tokens").wait_for(timeout=90000); mark("claimed"); page.wait_for_timeout(5000)
    as_(page, CALLER, call_url); mark("caller lock view"); page.mouse.wheel(0, 1200); page.wait_for_timeout(7000)
    page.goto(BASE + "/", wait_until="load"); mark("home end"); page.wait_for_timeout(3000)
    page.get_by_text("Lapsed, refundable").first.hover(); page.wait_for_timeout(7000)
    v = page.video.path(); ctx.close(); b.close()
    shutil.move(v, os.path.join(ROOT, "docs/pitch/demo.webm")); shutil.rmtree(vid, ignore_errors=True)
    json.dump({"call": call_url, "marks": log}, open(os.path.join(ROOT, "docs/demo-run.json"), "w"), indent=1)
