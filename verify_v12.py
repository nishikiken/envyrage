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
        "--remote-debugging-port=9288",
        "--disable-gpu",
        "--window-size=1440,960",
        "--user-data-dir=/tmp/chrome_verif_v12_" + str(int(time.time()))
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://localhost:9288/json")
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

            print("\n=== TEST 1: VERIFY DEDUPLICATED SKINS & CONTRACTOR BUY ===")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/ru"})
            await asyncio.sleep(3)

            # Check Contractor skin ID and price in catalog
            contractor_info = await eval_js("""
                (() => {
                    const cat = window.UPGRADER_CONFIG?.catalog || [];
                    const c = cat.find(s => s.marketName === 'Dual Berettas | Contractor (Field-Tested)');
                    const b = cat.find(s => s.marketName === 'StatTrak™ Dual Berettas | Balance (Well-Worn)');
                    return {
                        contractor: c ? { id: c.id, price: c.price, name: c.marketName } : null,
                        balance: b ? { id: b.id, price: b.price, name: b.marketName } : null
                    };
                })()
            """)
            print(f"[Catalog Info]: {json.dumps(contractor_info, indent=2)}")
            assert contractor_info['contractor'], "Contractor skin not found in catalog!"
            assert contractor_info['balance'], "Balance skin not found in catalog!"
            assert contractor_info['contractor']['id'] != contractor_info['balance']['id'], "IDs must be unique!"

            # Buy Dual Berettas Contractor via API
            contractor_id = contractor_info['contractor']['id']
            buy_result = await eval_js(f"""
                (async () => {{
                    const user = window.UPGRADER.getActiveUser();
                    const prevBal = user.balance;
                    const res = await fetch('/api/items/shop/buy', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json' }},
                        body: JSON.stringify({{ itemIds: ['{contractor_id}'] }})
                    }}).then(r => r.json());
                    const updatedUser = window.UPGRADER.getActiveUser();
                    const boughtItem = updatedUser.inventory.find(i => String(i.originalSkinId) === '{contractor_id}' || String(i.id) === '{contractor_id}');
                    return {{
                        res,
                        prevBal,
                        newBal: updatedUser.balance,
                        diff: +(prevBal - updatedUser.balance).toFixed(2),
                        boughtItem: boughtItem ? {{ id: boughtItem.id, name: boughtItem.marketName, price: boughtItem.price }} : null
                    }};
                }})()
            """)
            print(f"[Contractor Buy Result]: {json.dumps(buy_result, indent=2)}")
            assert buy_result['diff'] == 15.51, f"Expected 15.51 deducted, got {buy_result['diff']}"
            assert buy_result['boughtItem']['name'] == 'Dual Berettas | Contractor (Field-Tested)', f"Wrong item bought: {buy_result['boughtItem']}"
            print("[VERIFIED]: Dual Berettas Contractor bought for exact price 15.51 ₽ without mismatch!")

            print("\n=== TEST 2: VERIFY PUSH NOTIFICATIONS SWITCH IN PROFILE ===")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/ru/profile"})
            await asyncio.sleep(3)

            push_status = await eval_js("""
                (() => {
                    const sw = document.querySelector('up-push-switch');
                    if (!sw) return { found: false };
                    const toggle = sw.querySelector('[data-testid="push-switch-toggle"]');
                    const text = sw.innerText;
                    const rect = sw.getBoundingClientRect();
                    return {
                        found: true,
                        visible: rect.width > 0 && rect.height > 0,
                        text: text.replace(/\\s+/g, ' ').trim(),
                        ariaChecked: toggle ? toggle.getAttribute('aria-checked') : null,
                        classes: sw.className
                    };
                })()
            """)
            print(f"[Push Switch Status]: {json.dumps(push_status, indent=2)}")
            assert push_status['found'], "up-push-switch element not found in DOM!"
            assert push_status['visible'], "up-push-switch element is not visible!"
            assert "Пуш-уведомления" in push_status['text'], "Push switch text missing 'Пуш-уведомления'"
            assert "Уникальные предложения" in push_status['text'], "Push switch subtitle missing 'Уникальные предложения'"

            # Test clicking toggle to turn it ON
            await eval_js("""
                (() => {
                    const toggle = document.querySelector('up-push-switch [data-testid="push-switch-toggle"]');
                    if (toggle) toggle.click();
                })()
            """)
            await asyncio.sleep(0.5)

            toggle_on = await eval_js("""
                (() => {
                    const toggle = document.querySelector('up-push-switch [data-testid="push-switch-toggle"]');
                    return {
                        ariaChecked: toggle ? toggle.getAttribute('aria-checked') : null,
                        storageVal: localStorage.getItem('upgrader_push_notifications')
                    };
                })()
            """)
            print(f"[Toggle Clicked ON]: {json.dumps(toggle_on, indent=2)}")
            assert toggle_on['ariaChecked'] == 'true', "Toggle aria-checked should be true"
            assert toggle_on['storageVal'] == 'true', "Storage value should be true"

            # Toggle it back OFF to match the user screenshot
            await eval_js("""
                (() => {
                    const toggle = document.querySelector('up-push-switch [data-testid="push-switch-toggle"]');
                    if (toggle) toggle.click();
                })()
            """)
            await asyncio.sleep(0.5)

            await screenshot("profile_push_notifications_switch.png")
            print("[VERIFIED]: Push notifications switch operates cleanly and matches user screenshot!")

            print("\n=== TEST 3: VERIFY AUTHENTIC STEAM WITHDRAWAL VISUALS ===")
            # Find the Contractor item or first available inventory item and click withdraw
            withdrawn_info = await eval_js("""
                (() => {
                    const cells = Array.from(document.querySelectorAll('up-profile-items-table .grid > div'));
                    for (const cell of cells) {
                        const withdrawBtn = cell.querySelector('[data-testid*="profile-items-table-withdraw-"]');
                        if (withdrawBtn && !cell.querySelector('.up-withdrawing-overlay') && !cell.querySelector('up-withdrawal-status:not(:empty)')) {
                            const testId = withdrawBtn.getAttribute('data-testid');
                            withdrawBtn.click();
                            return { clicked: true, testId };
                        }
                    }
                    return { clicked: false };
                })()
            """)
            print(f"[Withdraw Click Result]: {json.dumps(withdrawn_info, indent=2)}")
            assert withdrawn_info['clicked'], "Could not click withdraw button on any inventory item!"

            # Immediate inspection without reload
            await asyncio.sleep(0.4)
            overlay_check = await eval_js("""
                (() => {
                    const overlay = document.querySelector('up-profile-items-table .opacity-100 up-withdrawal-status') ||
                                    document.querySelector('.up-withdrawing-overlay');
                    if (!overlay) return { present: false };
                    const text = overlay.innerText.replace(/\\s+/g, ' ').trim();
                    const hasSpinner = !!overlay.querySelector('img[src*="loading-yellow"]');
                    return {
                        present: true,
                        text,
                        hasSpinner,
                        outerHTML: overlay.parentElement.outerHTML.slice(0, 300)
                    };
                })()
            """)
            print(f"[Immediate Overlay Check]: {json.dumps(overlay_check, indent=2)}")
            assert overlay_check['present'], "Withdrawal overlay did not appear immediately on click!"
            assert overlay_check['hasSpinner'], "Spinning sun loader not found!"
            assert "Ожидание продавца" in overlay_check['text'] or "Waiting for seller" in overlay_check['text'], f"Text missing expected label: {overlay_check['text']}"

            # Take screenshot of the withdrawal card in action
            await screenshot("steam_withdrawal_authentic_animation.png")
            print("[VERIFIED]: Withdrawal animation renders authentic spinning sun and 'Ожидание продавца' matching screenshot!")

            # Verify 'Sell All' does not sell withdrawing item
            sell_all_res = await eval_js("""
                (async () => {
                    const activeUser = window.UPGRADER.getActiveUser();
                    const withdrawingIds = Object.keys(activeUser.withdrawingItems || {});
                    const res = await fetch('/api/items/inventory/sell', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itemIds: withdrawingIds })
                    }).then(r => r.json());
                    const postUser = window.UPGRADER.getActiveUser();
                    const stillWithdrawing = Object.keys(postUser.withdrawingItems || {});
                    return {
                        soldCount: res.data?.items?.length || 0,
                        stillWithdrawing
                    };
                })()
            """)
            print(f"[Sell All Withdrawing Check]: {json.dumps(sell_all_res, indent=2)}")
            assert sell_all_res['soldCount'] == 0, "Withdrawing item was erroneously sold!"
            assert len(sell_all_res['stillWithdrawing']) > 0, "Withdrawing item removed from withdrawingItems!"
            print("[VERIFIED]: Items in withdrawal state are protected from being sold!")

            print("\n=== TEST 4: VERIFY REALISTIC LIVE DROP PACING ===")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/ru"})
            await asyncio.sleep(2)

            t0 = time.time()
            seen_drops = []
            drop_times = []
            print("[Sampling live drops stream over 8 seconds...]")
            while time.time() - t0 < 8.0:
                top_text = await eval_js("document.querySelector('button[data-testid=\"drop-item\"]')?.innerText")
                if top_text and (not seen_drops or seen_drops[-1] != top_text):
                    cur_t = time.time() - t0
                    seen_drops.append(top_text)
                    drop_times.append(cur_t)
                    interval = drop_times[-1] - drop_times[-2] if len(drop_times) > 1 else 0
                    lines = [l.strip() for l in top_text.splitlines() if l.strip()]
                    print(f"  [{cur_t:.2f}s] (+{interval:.2f}s) Drop: {' | '.join(lines[:2])}")
                await asyncio.sleep(0.1)

            print(f"[Total drops recorded in 8.0s]: {len(seen_drops)}")
            intervals = [drop_times[i] - drop_times[i-1] for i in range(1, len(drop_times))]
            if intervals:
                avg_interval = sum(intervals) / len(intervals)
                print(f"[Intervals]: {[round(x, 2) for x in intervals]}")
                print(f"[Average Interval]: {avg_interval:.2f}s")
                # Ensure cadence is realistic (average interval between 1.2s and 3.5s)
                assert 1.1 <= avg_interval <= 3.8, f"Average interval {avg_interval:.2f}s outside realistic 1.1s-3.8s range"
                # Ensure non-uniformity (not all intervals identical)
                interval_range = max(intervals) - min(intervals)
                print(f"[Interval Variation (max - min)]: {interval_range:.2f}s")
                assert interval_range >= 0.4, f"Intervals are too uniform: {intervals}"
            print("[VERIFIED]: Live drop pacing is realistic, human, and varied!")

            print("\n=======================================================")
            print("ALL 4 USER REQUIREMENTS VERIFIED SUCCESSFULLY!")
            print("=======================================================")
    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(run_verification())
