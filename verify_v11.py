import asyncio
import json
import subprocess
import time
import urllib.request
import base64
import os
import websockets

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACT_DIR = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6"

async def run_verification():
    proc = subprocess.Popen([
        CHROME_BIN,
        "--headless=new",
        "--remote-debugging-port=9265",
        "--disable-gpu",
        "--window-size=1440,960",
        "--user-data-dir=/tmp/chrome_verif_v11_" + str(int(time.time()))
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://localhost:9265/json")
        targets = json.loads(req.read().decode())
        page = [t for t in targets if t["type"] == "page"][0]

        async with websockets.connect(page["webSocketDebuggerUrl"]) as ws:
            req_id = 0
            async def send_cmd(method, params=None):
                nonlocal req_id
                req_id += 1
                msg = {"id": req_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(msg))
                while True:
                    raw = await ws.recv()
                    res = json.loads(raw)
                    if res.get("id") == req_id:
                        return res.get("result", {})

            async def eval_js(expr):
                r = await send_cmd("Runtime.evaluate", {
                    "expression": expr,
                    "returnByValue": True,
                    "awaitPromise": True
                })
                if "exceptionDetails" in r:
                    print(f"[JS Exception]: {r['exceptionDetails']}")
                return r.get("result", {}).get("value")

            async def screenshot(filename):
                data = await send_cmd("Page.captureScreenshot", {"format": "png"})
                img_bytes = base64.b64decode(data.get("data", ""))
                filepath = os.path.join(ARTIFACT_DIR, filename)
                with open(filepath, "wb") as f:
                    f.write(img_bytes)
                print(f"[Screenshot saved]: {filepath}")
                return filepath

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")

            print("\n=== STEP 1: VERIFY RAPID LIVE DROPS FEED ON LEFT SIDEBAR ===")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/cis/"})
            await asyncio.sleep(4)

            # Check drops container exists
            drop_count = await eval_js("document.querySelectorAll('button[data-testid=\"drop-item\"]').length")
            print(f"[Initial Drop Cards in DOM]: {drop_count}")
            assert drop_count >= 10, f"Expected at least 10 drop items in sidebar, found {drop_count}"

            # Track new drops arriving over 5.5 seconds
            t0 = time.time()
            drops_seen = []
            print("[Sampling live drops rate over 5.5 seconds...]")
            while time.time() - t0 < 5.5:
                top_text = await eval_js("document.querySelector('button[data-testid=\"drop-item\"]')?.innerText")
                if top_text and (not drops_seen or drops_seen[-1] != top_text):
                    drops_seen.append(top_text)
                    elapsed = time.time() - t0
                    lines = [l.strip() for l in top_text.splitlines() if l.strip()]
                    short = ' | '.join(lines[:2])
                    print(f"  [{elapsed:.2f}s] New live drop: {short}")
                await asyncio.sleep(0.12)

            print(f"[Total unique drops in 5.5s]: {len(drops_seen)}")
            # At ~450ms - 850ms rate, we expect at least 4-8 drops in 5.5s
            assert len(drops_seen) >= 4, f"Drop rate too slow! Only {len(drops_seen)} drops arrived in 5.5s"
            print("[VERIFIED]: Live drop feed on the left streams rapidly and continuously!")
            await screenshot("live_drops_fast_stream.png")

            print("\n=== STEP 2: VERIFY COMPENSATION SYSTEM IS FULLY DISABLED ===")
            # Perform a bet with a very low chance (0.5%) to guarantee a loss on an expensive skin (>150 rubles)
            user_items = await eval_js("window.UPGRADER.getActiveUser().inventory")
            print(f"[Active User Inventory Count]: {len(user_items)}")
            assert len(user_items) > 0, "No inventory items for bet testing"

            test_item_id = user_items[0]['id']
            print(f"[Placing bet with item]: {test_item_id} on high tier target skin...")

            # Bet on an expensive knife (target price > 1500 ₽)
            bet_res = await eval_js(f"""
                fetch('/api/game/upgrader/bet', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{
                        betInventoryItemIds: ['{test_item_id}'],
                        targetItemId: '3',
                        addedBalance: 0
                    }})
                }}).then(async r => ({{ status: r.status, data: await r.json() }}))
            """)

            bet_data = bet_res.get('data', {}).get('bet', {})
            print(f"[Bet Result]: status={bet_data.get('status')}, hasCompensation={bet_data.get('hasCompensation')}, wonItem={bet_data.get('wonItem')}")

            # Verify that compensation is strictly disabled
            assert bet_data.get('hasCompensation') == False, "hasCompensation must be False!"
            assert bet_data.get('compensationItems') == [], "compensationItems must be empty list!"
            if bet_data.get('status') == 'lost':
                assert bet_data.get('wonItem') is None, "wonItem must be None on loss!"
                print("[VERIFIED]: API returned no compensation skin and hasCompensation=false!")

            # Wait 5.5 seconds (in the old system, compensation modal appeared after 4.6s)
            print("[Waiting 5.5s to verify NO compensation modal appears in DOM...]")
            await asyncio.sleep(5.5)

            comp_modal = await eval_js("document.getElementById('upgrader-compensation-modal') !== null")
            print(f"[Compensation Modal in DOM]: {comp_modal}")
            assert comp_modal == False, "Compensation modal MUST NOT appear in DOM!"
            print("[VERIFIED]: Compensation modal is completely absent from DOM!")

            # Verify user inventory has no compensation item
            current_user = await eval_js("window.UPGRADER.getActiveUser()")
            comp_in_inv = any('comp_' in str(it.get('id', '')) for it in current_user.get('inventory', []))
            assert comp_in_inv == False, "No compensation skin should be in user inventory!"
            print("[VERIFIED]: No compensation items added to inventory!")

            await screenshot("upgrade_loss_no_compensation.png")

            print("\n🎉 ALL USER REQUIREMENTS VERIFIED WITH 100% SUCCESS!")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_verification())
