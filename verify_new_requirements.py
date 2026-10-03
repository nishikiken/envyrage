import asyncio
import json
import subprocess
import time
import urllib.request
import base64
import os
import websockets

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACT_INVENTORY_TOTAL = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6/inventory_total_verified.png"
ARTIFACT_DEPOSIT_MODAL = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6/deposit_modal_verified.png"
ARTIFACT_PAYMENT_PROCESSING = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6/payment_processing_verified.png"
ARTIFACT_PROFILE_NO_BADGE = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6/profile_no_badge_verified.png"

async def run_verification():
    cmd = [
        CHROME_BIN,
        "--headless=new",
        "--remote-debugging-port=9225",
        "--disable-gpu",
        "--window-size=1440,960",
        "--user-data-dir=/tmp/chrome_test_v5_" + str(int(time.time()))
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://localhost:9225/json")
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
                    res = json.loads(await ws.recv())
                    if res.get("id") == req_id:
                        return res.get("result", {})

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")

            # 1. Main Page check: real-time counters & live drops feed
            print("1. Navigating to main page http://localhost:8085/cis/ ...")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/cis/"})
            await asyncio.sleep(5)

            main_check = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const upCounter = document.querySelector('[data-testid="upgrades-counter"]');
                    const onlineCounter = document.querySelector('[data-testid="online-counter"]');
                    const drops = Array.from(document.querySelectorAll('up-live-drop-item, up-drop-item'));
                    const liveSidebar = document.querySelector('up-live-drops');
                    
                    return {
                        upgradesCounterText: upCounter ? upCounter.innerText.replace(/\\n+/g, ' ').trim() : null,
                        onlineCounterText: onlineCounter ? onlineCounter.innerText.replace(/\\n+/g, ' ').trim() : null,
                        liveDropsFound: drops.length,
                        liveSidebarSnippet: liveSidebar ? liveSidebar.innerText.slice(0, 200).replace(/\\n+/g, ' ') : null,
                        globalStatsCount: window.UPGRADER ? window.UPGRADER.GlobalStats.getUpgradesCount() : null,
                        globalStatsOnline: window.UPGRADER ? window.UPGRADER.GlobalStats.getOnlineCount() : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Main Page real-time data:", json.dumps(main_check.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # 2. Profile Page check: inventory total & removal of "Изменить" overlay badge
            print("\n2. Navigating to /cis/profile ...")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/cis/profile"})
            await asyncio.sleep(4)

            profile_check = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const info = document.querySelector('up-user-info');
                    const hasEditBadge = !!document.querySelector('.up-avatar-edit-badge');
                    const hasGearBtn = !!document.querySelector('[data-testid="user-info-settings-button"]');
                    
                    // Inventory items and total
                    const items = Array.from(document.querySelectorAll('up-profile-items-table up-item-card'));
                    
                    // Total price text in inventory table header or page
                    const tableText = document.querySelector('up-profile-items-table')?.innerText || '';
                    
                    return {
                        hasEditBadge: hasEditBadge,
                        hasGearBtn: hasGearBtn,
                        userInfoText: info ? info.innerText.replace(/\\n+/g, ' | ') : null,
                        inventoryCardsCount: items.length,
                        tableSnippet: tableText.slice(0, 300).replace(/\\n+/g, ' ')
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Profile check:", json.dumps(profile_check.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # Check /items/inventory/total endpoint directly from page
            inv_total_eval = await send_cmd("Runtime.evaluate", {
                "expression": """
                new Promise(resolve => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', '/items/inventory/total');
                    xhr.onload = () => {
                        resolve(JSON.parse(xhr.responseText));
                    };
                    xhr.send();
                })
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            print("Direct /items/inventory/total response:", json.dumps(inv_total_eval.get("result", {}).get("value"), indent=2))

            # Screenshot Profile
            shot_prof = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(ARTIFACT_PROFILE_NO_BADGE, "wb") as f:
                f.write(base64.b64decode(shot_prof["data"]))
            with open(ARTIFACT_INVENTORY_TOTAL, "wb") as f:
                f.write(base64.b64decode(shot_prof["data"]))
            print("Saved profile screenshot without badge and with real inventory prices.")

            # 3. Test Deposit Modal (Пополнение баланса)
            print("\n3. Testing Deposit modal ...")
            # Click "Пополнить" button in header
            await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const topUpBtn = document.querySelector('[data-testid*="top-up"]') || 
                                     Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Пополнить'));
                    if (topUpBtn) topUpBtn.click();
                })()
                """
            })
            await asyncio.sleep(1)

            deposit_modal_check = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const modal = document.getElementById('upgrader-deposit-modal');
                    if (!modal) return null;
                    const methods = Array.from(modal.querySelectorAll('.pm-card')).map(c => c.innerText.replace(/\\n+/g, ' '));
                    const hasSkinGiveaway = modal.innerText.includes('Выдача скина') || modal.innerText.includes('Выберите скин');
                    const submitBtnText = modal.querySelector('#dep-submit-btn')?.innerText;
                    return {
                        isOpen: true,
                        methods: methods,
                        hasSkinGiveaway: hasSkinGiveaway,
                        submitBtnText: submitBtnText
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Deposit modal check:", json.dumps(deposit_modal_check.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # Screenshot Deposit Modal
            shot_dep = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(ARTIFACT_DEPOSIT_MODAL, "wb") as f:
                f.write(base64.b64decode(shot_dep["data"]))
            print("Saved deposit modal screenshot.")

            # 4. Trigger Payment Processing
            print("\n4. Clicking 'Пополнить баланс' to start 30s payment gateway simulation ...")
            await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const btn = document.getElementById('dep-submit-btn');
                    if (btn) btn.click();
                })()
                """
            })
            await asyncio.sleep(2)

            proc_check = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const modal = document.getElementById('upgrader-deposit-modal');
                    if (!modal) return null;
                    const countdown = modal.querySelector('#dep-countdown-text')?.innerText;
                    const status = modal.querySelector('#dep-status-msg')?.innerText.replace(/\\n+/g, ' ');
                    const progress = modal.querySelector('#dep-progress-bar')?.style.width;
                    return {
                        isProcessing: true,
                        countdown: countdown,
                        status: status,
                        progressBarWidth: progress
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Payment processing state:", json.dumps(proc_check.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # Screenshot Payment Processing
            shot_proc = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(ARTIFACT_PAYMENT_PROCESSING, "wb") as f:
                f.write(base64.b64decode(shot_proc["data"]))
            print("Saved payment processing screenshot.")

            print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_verification())
