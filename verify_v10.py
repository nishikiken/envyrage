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
        "--remote-debugging-port=9244",
        "--disable-gpu",
        "--window-size=1440,960",
        "--user-data-dir=/tmp/chrome_verif_v10_" + str(int(time.time()))
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://localhost:9244/json")
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

            print("\n=== STEP 1: LOAD PROFILE PAGE & CHECK BALANCE SPEED ===")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/cis/profile"})
            await asyncio.sleep(3)

            # Open deposit modal
            await eval_js("window.UPGRADER.renderDepositModal()")
            await asyncio.sleep(1)

            # Select 500 and click pay
            await eval_js("""
                const chips = document.querySelectorAll('.dep-chip');
                if (chips[1]) chips[1].click();
                const payBtn = document.querySelector('#dep-pay-btn');
                if (payBtn) payBtn.click();
            """)
            await asyncio.sleep(0.5)

            # Measure duration
            t0 = time.time()
            text = await eval_js("document.querySelector('#dep-countdown-text')?.textContent")
            print(f"[Deposit Countdown Started]: {text}")
            await screenshot("deposit_countdown_v10.png")

            # Wait for finish (should finish within 5-10s)
            finished = False
            for _ in range(15):
                await asyncio.sleep(1)
                is_done = await eval_js("document.querySelector('#dep-done-btn') !== null")
                if is_done:
                    elapsed = time.time() - t0
                    print(f"[Deposit Finished in {elapsed:.1f}s (Target: 5-10s)]")
                    assert 4.0 <= elapsed <= 12.0, f"Deposit duration {elapsed}s outside expected range!"
                    finished = True
                    break

            assert finished, "Deposit did not finish in time!"
            await screenshot("deposit_success_v10.png")

            # Close deposit modal
            await eval_js("""
                const doneBtn = document.querySelector('#dep-done-btn');
                if (doneBtn) doneBtn.click();
            """)
            await asyncio.sleep(2)

            print("\n=== STEP 2: VERIFY AUTHENTIC STEAM WITHDRAWAL LAYOUT ===")
            # Check active user inventory
            inv = await eval_js("window.UPGRADER.getActiveUser().inventory")
            print(f"[User Inventory Items]: {len(inv)}")
            if len(inv) > 0:
                first_item = inv[0]
                first_id = first_item['id']
                print(f"[Testing withdrawal on item]: {first_item.get('marketName')} (id: {first_id})")

                # Trigger withdrawal
                overlay_html = await eval_js("""(() => {
                    const user = window.UPGRADER.getActiveUser();
                    const item = user.inventory[0];
                    window.UPGRADER.LocalDB.startWithdrawal(user.username, item);
                    window.UPGRADER.syncWithdrawingCards();
                    const overlay = document.querySelector('.up-withdrawing-overlay');
                    return overlay ? overlay.innerHTML : null;
                })()""")

                # Check Stage 1: Waiting for seller
                print(f"[Stage 1 Overlay HTML preview]: {overlay_html[:120] if overlay_html else 'None'}")
                assert "Ожидание продавца..." in (overlay_html or ""), "Stage 1 text 'Ожидание продавца...' not found!"
                assert "loading-yellow.svg" in (overlay_html or ""), "Stage 1 loader icon not found!"
                await asyncio.sleep(0.5)
                await screenshot("withdrawal_stage1_seller_wait.png")

                # Wait 4 seconds for Stage 2 (Trade Ready with timer + button)
                print("[Waiting 4s for Stage 2 Trade Ready...]")
                await asyncio.sleep(4.5)
                overlay_html2 = await eval_js("""(() => {
                    window.UPGRADER.syncWithdrawingCards();
                    const overlay = document.querySelector('.up-withdrawing-overlay');
                    return overlay ? overlay.innerHTML : null;
                })()""")
                print(f"[Stage 2 Overlay HTML preview]: {overlay_html2[:150] if overlay_html2 else 'None'}")
                assert "Принять" in (overlay_html2 or ""), "Stage 2 'Принять' button not found!"
                assert "yellowTimer.svg" in (overlay_html2 or ""), "Stage 2 timer icon not found!"
                assert "steamcommunity.com/tradeoffer" in (overlay_html2 or ""), "Steam trade offer link not found!"
                await screenshot("withdrawal_stage2_accept_trade.png")

            print("\n=== STEP 3: VERIFY WITHDRAWING SKIN IS ISOLATED FROM MAIN UPGRADER PAGE ===")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/cis/"})
            await asyncio.sleep(3)

            # Query items from /api/items/inventory via fetch
            main_inv = await eval_js("""
                fetch('/api/items/inventory')
                    .then(r => r.json())
                    .then(d => d.data.items)
            """)
            print(f"[Main Page Inventory Items count]: {len(main_inv)}")
            for it in main_inv:
                assert str(it.get('id')) != str(first_id), f"Withdrawing item {first_id} leaked to main page!"
            print("[VERIFIED]: Withdrawing item is NOT in available inventory on main page!")

            # Try to bet the withdrawing item
            bet_res = await eval_js(f"""
                fetch('/api/game/upgrader/bet', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{
                        betInventoryItemIds: ['{first_id}'],
                        targetItemId: '3',
                        addedBalance: 0
                    }})
                }}).then(async r => ({{ status: r.status, data: await r.json() }}))
            """)
            print(f"[Bet on withdrawing item response]: status={bet_res.get('status')}, data={bet_res.get('data')}")
            assert bet_res.get('status') == 400, "Bet on withdrawing item was NOT blocked with 400!"
            print("[VERIFIED]: Bet on withdrawing item was strictly rejected with 400!")
            await screenshot("main_page_isolated_inventory.png")

            print("\n=== STEP 4: VERIFY MODERN COMPENSATION CASE ROULETTE ===")
            # Render compensation case modal with a test item
            await eval_js("""
                const compSkin = {
                    id: 'comp_test_' + Date.now(),
                    marketName: 'M4A4 | 龍王 (Dragon King) (Field-Tested)',
                    price: '485.50',
                    image: 'https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJKz2lu_XsnXwtmkJjSU91dh8bj35VTqVBP4io_frHQV7KCnOaZ9JKaSWTTJxrws57UvSXnmmktwtG7RmNqqIH3FaAdzDscjR_lK7EdV-bO9cw/360fx360f',
                    extra: { r: 10, ch: 'eb4b4b' }
                };
                window.UPGRADER.renderCompensationCaseModal(compSkin);
            """)
            await asyncio.sleep(1)

            # Verify Case Drop view
            case_title = await eval_js("document.querySelector('#comp-modal-card h2')?.textContent")
            print(f"[Case Drop Title]: {case_title}")
            assert "КЕЙС КОМПЕНСАЦИИ" in (case_title or ""), "Case title missing!"
            await screenshot("compensation_step1_case_drop.png")

            # Click "ОТКРЫТЬ КЕЙС" to start roulette
            print("[Clicking 'ОТКРЫТЬ КЕЙС'...]")
            await eval_js("""
                const btn = document.querySelector('#btn-open-comp-case');
                if (btn) btn.click();
            """)
            await asyncio.sleep(1)

            # Verify roulette strip spinning
            spinning_title = await eval_js("document.querySelector('#comp-modal-card h2')?.textContent")
            print(f"[Roulette Title]: {spinning_title}")
            assert "РУЛЕТКУ" in (spinning_title or ""), "Roulette spinning view missing!"
            await screenshot("compensation_step2_roulette_spinning.png")

            # Wait 4.8 seconds for roulette deceleration and win reveal
            print("[Waiting for roulette finish & win reveal (4.8s)...]")
            await asyncio.sleep(4.8)

            won_title = await eval_js("document.querySelector('#comp-modal-card h2')?.textContent")
            print(f"[Won Screen Title]: {won_title}")
            assert "НАГРАДА" in (won_title or ""), "Won screen title missing!"
            won_skin_name = await eval_js("document.querySelector('#comp-modal-card')?.textContent")
            assert "Dragon King" in (won_skin_name or "") or "485" in (won_skin_name or ""), "Won skin details missing!"
            await screenshot("compensation_step3_won_screen.png")

            # Test selling compensation skin
            old_bal = await eval_js("window.UPGRADER.getActiveUser().balance")
            await eval_js("document.querySelector('#btn-comp-sell')?.click()")
            await asyncio.sleep(1)
            new_bal = await eval_js("window.UPGRADER.getActiveUser().balance")
            print(f"[Balance before sell]: {old_bal}, [Balance after sell]: {new_bal}")
            assert new_bal > old_bal, "Balance was not credited after selling compensation skin!"
            print("[VERIFIED]: Compensation skin sold and balance credited successfully!")

            print("\n🎉 ALL 4 USER REQUIREMENTS VERIFIED WITH 100% SUCCESS!")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_verification())
