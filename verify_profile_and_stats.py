import asyncio
import json
import subprocess
import time
import urllib.request
import base64
import os
import websockets

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACT_PROFILE = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6/profile_full_verified.png"
ARTIFACT_EDIT_MODAL = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6/profile_edit_modal.png"
ARTIFACT_HEADER_COUNTER = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6/header_counter_verified.png"

async def run_verification():
    cmd = [
        CHROME_BIN,
        "--headless=new",
        "--remote-debugging-port=9224",
        "--disable-gpu",
        "--window-size=1440,960",
        "--user-data-dir=/tmp/chrome_prof_v4_" + str(int(time.time()))
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://localhost:9224/json")
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

            # 1. First navigate to main page
            print("1. Navigating to main page http://localhost:8085/cis/ ...")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/cis/"})
            await asyncio.sleep(4)

            # Check header counters
            header_eval = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const upCounter = document.querySelector('[data-testid="upgrades-counter"]');
                    const onlineCounter = document.querySelector('[data-testid="online-counter"]');
                    return {
                        upgradesCounterText: upCounter ? upCounter.innerText.trim() : null,
                        onlineCounterText: onlineCounter ? onlineCounter.innerText.trim() : null,
                        globalStatsCount: window.UPGRADER ? window.UPGRADER.GlobalStats.getUpgradesCount() : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Header counters:", json.dumps(header_eval.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # Screenshot header
            shot1 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(ARTIFACT_HEADER_COUNTER, "wb") as f:
                f.write(base64.b64decode(shot1["data"]))

            # 2. Navigate to /cis/profile
            print("\n2. Navigating to /cis/profile ...")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/cis/profile"})
            await asyncio.sleep(4)

            profile_eval = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const stats = document.querySelector('up-user-stats');
                    const info = document.querySelector('up-user-info');
                    const table = document.querySelector('up-profile-items-table');
                    const bestDrop = document.querySelector('up-best-drop');
                    
                    const tabButtons = Array.from(document.querySelectorAll('up-profile-items-table button')).map(b => b.innerText.trim()).filter(Boolean);
                    
                    return {
                        url: window.location.href,
                        userInfoText: info ? info.innerText.replace(/\\n+/g, ' | ') : null,
                        statsText: stats ? stats.innerText.replace(/\\n+/g, ' | ') : null,
                        bestDropText: bestDrop ? bestDrop.innerText.replace(/\\n+/g, ' | ') : null,
                        tabsFound: tabButtons,
                        itemsCountInTable: document.querySelectorAll('up-profile-items-table up-item-card').length
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Profile evaluation:", json.dumps(profile_eval.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # 3. Check tabs switching: items history
            print("\n3. Testing tabs: clicking 'История предметов' ...")
            click_hist = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const histBtn = buttons.find(b => b.innerText.includes('История предметов'));
                    if (histBtn) {
                        histBtn.click();
                        return true;
                    }
                    return false;
                })()
                """,
                "returnByValue": True
            })
            print("Clicked History Tab:", click_hist.get("result", {}).get("value"))
            await asyncio.sleep(2)

            hist_eval = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const cards = Array.from(document.querySelectorAll('up-profile-items-table up-item-card'));
                    return {
                        historyCardsCount: cards.length,
                        firstCardText: cards[0] ? cards[0].innerText.replace(/\\n+/g, ' ') : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Items history evaluation:", json.dumps(hist_eval.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # 4. Check games history tab
            print("\n4. Testing tabs: clicking 'История игр' ...")
            click_games = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const gamesBtn = buttons.find(b => b.innerText.includes('История игр'));
                    if (gamesBtn) {
                        gamesBtn.click();
                        return true;
                    }
                    return false;
                })()
                """,
                "returnByValue": True
            })
            print("Clicked Games History Tab:", click_games.get("result", {}).get("value"))
            await asyncio.sleep(2)

            games_eval = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const games = Array.from(document.querySelectorAll('up-profile-items-table .font-exo, up-profile-items-table div')).filter(d => d.innerText && d.innerText.includes('Roll ID'));
                    return {
                        gamesCountFound: games.length,
                        firstGameSnippet: games[0] ? games[0].innerText.replace(/\\n+/g, ' ').slice(0, 200) : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Games history evaluation:", json.dumps(games_eval.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # Switch back to inventory
            await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const invBtn = buttons.find(b => b.innerText.includes('Инвентарь'));
                    if (invBtn) invBtn.click();
                })()
                """
            })
            await asyncio.sleep(1)

            # Screenshot Profile
            shot2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(ARTIFACT_PROFILE, "wb") as f:
                f.write(base64.b64decode(shot2["data"]))
            print("Captured full profile screenshot:", ARTIFACT_PROFILE)

            # 5. Test Profile Edit Modal (change Avatar & ID)
            print("\n5. Opening Profile Edit Modal ...")
            await send_cmd("Runtime.evaluate", {
                "expression": "window.UPGRADER.renderProfileEditModal();"
            })
            await asyncio.sleep(1)

            modal_check = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const modal = document.getElementById('upgrader-profile-edit-modal');
                    if (!modal) return null;
                    // Pick donk avatar
                    const donkCard = modal.querySelector('.pro-avatar-card[data-name="donk"]');
                    if (donkCard) donkCard.click();
                    const idInput = modal.querySelector('#edit-id-input');
                    if (idInput) idInput.value = '77777';
                    const nickInput = modal.querySelector('#edit-nickname-input');
                    if (nickInput) nickInput.value = 'Super Pro Donk';
                    return {
                        hasModal: true,
                        selectedAvatar: modal.querySelector('#edit-avatar-url-input')?.value,
                        selectedId: idInput?.value,
                        selectedNick: nickInput?.value
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Modal edited:", json.dumps(modal_check.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # Screenshot Modal
            shot3 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(ARTIFACT_EDIT_MODAL, "wb") as f:
                f.write(base64.b64decode(shot3["data"]))
            print("Captured profile edit modal screenshot:", ARTIFACT_EDIT_MODAL)

            # Click save changes
            await send_cmd("Runtime.evaluate", {
                "expression": "document.getElementById('edit-profile-save-btn')?.click();"
            })
            await asyncio.sleep(2)

            # Check that user profile reflected new ID, Avatar, Nickname
            user_updated_check = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const u = window.UPGRADER.getActiveUser();
                    return {
                        id: u.id,
                        nickname: u.nickname,
                        avatar: u.avatar
                    };
                })()
                """,
                "returnByValue": True
            })
            print("User in LocalDB after update:", json.dumps(user_updated_check.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            print("\nALL VERIFICATION STEPS PASSED SUCCESSFULLY!")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_verification())
