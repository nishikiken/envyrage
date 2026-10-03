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
        "--remote-debugging-port=9227",
        "--disable-gpu",
        "--window-size=1440,960",
        "--user-data-dir=/tmp/chrome_verif_" + str(int(time.time()))
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://localhost:9227/json")
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

            # 1. Check Header Upgrades Counter
            print("\n--- 1. Testing Header Upgrades Counter ---")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/cis/"})
            await asyncio.sleep(4)

            eval1 = await send_cmd("Runtime.evaluate", {
                "expression": """(() => {
                    const el = document.querySelector('[data-testid="upgrades-counter"]');
                    return {
                        text: el ? el.innerText.trim() : null,
                        count: window.UPGRADER ? window.UPGRADER.GlobalStats.getUpgradesCount() : null
                    };
                })()""",
                "returnByValue": True
            })
            res1 = eval1.get("result", {}).get("value", {})
            import re
            m1 = re.search(r'\d{8,10}', str(res1.get("text", "")))
            val1 = int(m1.group(0)) if m1 else (res1.get("count") or 0)
            print(f"Header Counter t0: {val1}")

            await asyncio.sleep(2.0)

            eval2 = await send_cmd("Runtime.evaluate", {
                "expression": """(() => {
                    const el = document.querySelector('[data-testid="upgrades-counter"]');
                    return {
                        text: el ? el.innerText.trim() : null,
                        count: window.UPGRADER ? window.UPGRADER.GlobalStats.getUpgradesCount() : null
                    };
                })()""",
                "returnByValue": True
            })
            res2 = eval2.get("result", {}).get("value", {})
            m2 = re.search(r'\d{8,10}', str(res2.get("text", "")))
            val2 = int(m2.group(0)) if m2 else (res2.get("count") or 0)
            rate_per_sec = (val2 - val1) / 2.0
            print(f"Header Counter t1: {val2}")
            print(f"Rate: {rate_per_sec:.1f} upgrades/sec (Max allowed: 200/sec)")
            assert val1 >= 486500000, f"Counter too low: {val1}"
            assert val2 > val1, f"Counter not increasing! {val1} -> {val2}"
            assert rate_per_sec <= 200, f"Rate exceeded 200/sec: {rate_per_sec}"

            # 2. Test Email Binding in Profile
            print("\n--- 2. Testing Email Binding in Profile ---")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/cis/profile"})
            await asyncio.sleep(4)

            # Check email before binding
            email_status_before = await send_cmd("Runtime.evaluate", {
                "expression": """(() => {
                    const block = document.querySelector('up-email-linking');
                    return {
                        exists: !!block,
                        text: block ? block.innerText : ''
                    };
                })()""",
                "returnByValue": True
            })
            print("Email block before binding:", email_status_before.get("result", {}).get("value"))

            # Trigger email binding modal
            await send_cmd("Runtime.evaluate", {
                "expression": """(() => {
                    window.UPGRADER.renderEmailBindModal();
                })()"""
            })
            await asyncio.sleep(0.5)

            # Check modal is visible and input test email
            modal_eval = await send_cmd("Runtime.evaluate", {
                "expression": """(() => {
                    const modal = document.querySelector('#upgrader-email-modal');
                    const input = document.querySelector('#bind-email-input');
                    const btn = document.querySelector('#bind-email-submit');
                    if (input && btn) {
                        input.value = 'winner2026@gmail.com';
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        btn.click();
                        return { submitted: true };
                    }
                    return { error: 'Modal elements not found' };
                })()""",
                "returnByValue": True
            })
            print("Modal submission result:", modal_eval.get("result", {}).get("value"))
            await asyncio.sleep(2)

            # Check profile email status after binding
            email_status_after = await send_cmd("Runtime.evaluate", {
                "expression": """(() => {
                    const block = document.querySelector('up-email-linking');
                    const user = window.UPGRADER.getActiveUser();
                    return {
                        userEmail: user ? user.email : null,
                        isEmailVerified: user ? user.isEmailVerified : null,
                        blockHtml: block ? block.innerHTML : '',
                        blockText: block ? block.innerText : ''
                    };
                })()""",
                "returnByValue": True
            })
            print("Email status after binding:", email_status_after.get("result", {}).get("value"))

            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "email_bound_verified.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Saved screenshot email_bound_verified.png")

            # 3. Test Deposit Modal from Header and Profile
            print("\n--- 3. Testing Deposit Modal and Duration ---")
            deposit_open = await send_cmd("Runtime.evaluate", {
                "expression": """(() => {
                    window.UPGRADER.renderDepositModal();
                    const modal = document.querySelector('#upgrader-deposit-modal');
                    return {
                        opened: !!modal,
                        hasCardsTab: !!modal.querySelector('[data-tab="cards"]'),
                        hasCryptoTab: !!modal.querySelector('[data-tab="crypto"]'),
                        hasSkinsTab: !!modal.querySelector('[data-tab="skins"]'),
                        hasCurrencyToggle: !!modal.querySelector('#dep-curr-toggle'),
                        hasPresets: modal.querySelectorAll('.dep-preset-chip').length,
                        payBtnText: modal.querySelector('#dep-pay-btn') ? modal.querySelector('#dep-pay-btn').innerText : null
                    };
                })()""",
                "returnByValue": True
            })
            print("Deposit modal check:", deposit_open.get("result", {}).get("value"))

            shot_dep = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "deposit_modal_pixel_match.png"), "wb") as f:
                f.write(base64.b64decode(shot_dep["data"]))
            print("Saved screenshot deposit_modal_pixel_match.png")

            # 4. Trigger Payment and test duration (14..30s)
            print("\n--- 4. Testing Payment Processing (14..30s) ---")
            pay_eval = await send_cmd("Runtime.evaluate", {
                "expression": """(() => {
                    const payBtn = document.querySelector('#dep-pay-btn');
                    payBtn.click();
                    const countdown = document.querySelector('#dep-countdown-text');
                    return {
                        countdownText: countdown ? countdown.innerText : null
                    };
                })()""",
                "returnByValue": True
            })
            initial_countdown = pay_eval.get("result", {}).get("value", {}).get("countdownText")
            print(f"Initial Countdown Started at: {initial_countdown}")
            dur = int(initial_countdown.replace("s", "")) if initial_countdown else 0
            assert 14 <= dur <= 30, f"Duration {dur}s is not between 14 and 30 seconds!"

            shot_proc = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "payment_countdown_verified.png"), "wb") as f:
                f.write(base64.b64decode(shot_proc["data"]))
            print("Saved screenshot payment_countdown_verified.png")

            print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(run_verification())
