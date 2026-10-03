import asyncio, json, subprocess, time, urllib.request, base64, os
import websockets

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ARTIFACT_WITHDRAW = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6/withdrawal_animation.png"
ARTIFACT_SHOP_SORT = "/Users/tymur/.gemini/antigravity/brain/8e934a07-032b-4b46-bde8-ebe0ee3a6fd6/shop_sort_verified.png"

async def test():
    cmd = [
        CHROME_BIN,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--disable-gpu",
        "--window-size=1440,960",
        "--user-data-dir=/tmp/chrome_test_v3_" + str(int(time.time()))
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://localhost:9222/json")
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

            print("Navigating to http://localhost:8085/ ...")
            await send_cmd("Page.navigate", {"url": "http://localhost:8085/"})
            await asyncio.sleep(4)

            # 1. Check knife colors in DOM
            knife_color_check = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const cards = Array.from(document.querySelectorAll('up-item-card'));
                    const knifeCards = cards.filter(c => c.textContent.includes('★') || c.textContent.includes('Knife') || c.textContent.includes('Navaja') || c.textContent.includes('Gut'));
                    return {
                        totalCards: cards.length,
                        knifeCardsFound: knifeCards.length,
                        firstKnifeText: knifeCards[0] ? knifeCards[0].textContent.trim() : null,
                        firstKnifeHTML: knifeCards[0] ? knifeCards[0].outerHTML.slice(0, 300) : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("1. Knife color check:", json.dumps(knife_color_check.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # 2. Test sorting: click sort button in shop
            sort_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const rightTable = document.querySelector('up-desired-items-table');
                    if (!rightTable) return { error: 'No right table' };
                    const sortBtn = rightTable.querySelector('up-sort-button') || rightTable.querySelector('button[class*=\"sort\"]');
                    if (!sortBtn) return { error: 'No sort button in right table' };
                    sortBtn.click();
                    return { success: true };
                })()
                """,
                "returnByValue": True
            })
            print("2. Clicked sort button:", json.dumps(sort_res.get("result", {}).get("value"), indent=2))
            await asyncio.sleep(2)

            # Check shop items after sort
            shop_items_after_sort = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const rightTable = document.querySelector('up-desired-items-table');
                    const cards = rightTable ? Array.from(rightTable.querySelectorAll('up-item-card')) : [];
                    return {
                        cardsCount: cards.length,
                        firstCard: cards[0] ? cards[0].textContent.trim() : null,
                        secondCard: cards[1] ? cards[1].textContent.trim() : null,
                        thirdCard: cards[2] ? cards[2].textContent.trim() : null
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Shop items after sort:", json.dumps(shop_items_after_sort.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # Capture screenshot of sorted shop
            shot1 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(ARTIFACT_SHOP_SORT, "wb") as f:
                f.write(base64.b64decode(shot1["data"]))
            print("Saved shop sort screenshot to", ARTIFACT_SHOP_SORT)

            # 3. Test skin selling
            sell_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (async () => {
                    const activeUser = LocalDB.getActiveUser();
                    const initialBal = activeUser.balance;
                    const inv = activeUser.inventory || [];
                    if (!inv.length) return { error: 'No items in inventory' };
                    const itemToSell = inv[0];

                    // Call the sell API
                    const resp = await fetch('/api/items/inventory/sell', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ inventoryItemIds: [itemToSell.id] })
                    });
                    const data = await resp.json();
                    const newActiveUser = LocalDB.getActiveUser();

                    return {
                        soldItem: itemToSell.marketName,
                        soldPrice: itemToSell.price,
                        oldBalance: initialBal,
                        newBalance: newActiveUser.balance,
                        apiResponse: data,
                        remainingInventory: (newActiveUser.inventory || []).length
                    };
                })()
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            print("3. Sell item result:", json.dumps(sell_res.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # 4. Test withdrawal animation
            withdraw_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (async () => {
                    const activeUser = LocalDB.getActiveUser();
                    const inv = activeUser.inventory || [];
                    const item = inv[0];
                    const resp = await fetch('/withdrawals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ inventoryItemId: item ? item.id : '1001' })
                    });
                    const data = await resp.json();
                    return {
                        apiResp: data,
                        modalExists: !!document.getElementById('upgrader-withdrawal-modal')
                    };
                })()
                """,
                "awaitPromise": True,
                "returnByValue": True
            })
            print("4. Withdrawal call result:", json.dumps(withdraw_res.get("result", {}).get("value"), indent=2, ensure_ascii=False))

            # Wait 1.5s for step 2 of animation and take screenshot of withdrawal modal!
            await asyncio.sleep(1.8)
            shot2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(ARTIFACT_WITHDRAW, "wb") as f:
                f.write(base64.b64decode(shot2["data"]))
            print("Saved withdrawal modal screenshot to", ARTIFACT_WITHDRAW)

    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(test())
