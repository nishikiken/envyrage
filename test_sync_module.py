import asyncio
import json
import ssl
import threading
import time
import urllib.request
import websockets

class UpgraderLiveSync:
    def __init__(self):
        self.online = 4500
        self.games_count = 486039960
        self.live_drops = []
        self.seen_drop_ids = set()
        self.new_drops_queue = []
        self._lock = threading.Lock()
        self._running = True

    def start(self):
        t_ws = threading.Thread(target=self._ws_worker, daemon=True)
        t_ws.start()
        t_poll = threading.Thread(target=self._poll_worker, daemon=True)
        t_poll.start()

    def _ws_worker(self):
        async def run():
            ssl_ctx = ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE
            headers = {
                "Origin": "https://upgrader.best",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            while self._running:
                try:
                    async with websockets.connect("wss://upgrader.best/api/ws", ssl=ssl_ctx, additional_headers=headers) as ws:
                        await ws.send(json.dumps({"event": "subscribe", "room": "online"}))
                        await ws.send(json.dumps({"id": "init_online", "event": "online"}))
                        while self._running:
                            msg = await ws.recv()
                            data = json.loads(msg)
                            val = data.get("data")
                            if (data.get("event") == "online" or data.get("id") == "init_online") and isinstance(val, (int, float)):
                                with self._lock:
                                    self.online = int(val)
                except Exception as e:
                    await asyncio.sleep(3)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(run())

    def _poll_worker(self):
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        headers = {"User-Agent": "Mozilla/5.0"}

        while self._running:
            # 1. Poll games count
            try:
                req = urllib.request.Request("https://upgrader.best/api/statistics/games-count", headers=headers)
                with urllib.request.urlopen(req, context=ssl_ctx, timeout=4) as r:
                    res = json.loads(r.read().decode())
                    cnt = res.get("count")
                    if isinstance(cnt, int):
                        with self._lock:
                            self.games_count = cnt
            except Exception:
                pass

            # 2. Poll live drops
            try:
                req = urllib.request.Request("https://upgrader.best/api/live-drops", headers=headers)
                with urllib.request.urlopen(req, context=ssl_ctx, timeout=4) as r:
                    res = json.loads(r.read().decode())
                    drops = res.get("liveDrops", [])
                    if drops:
                        with self._lock:
                            # Detect newly seen drops
                            fresh = []
                            for d in drops:
                                did = str(d.get("id"))
                                if did and did not in self.seen_drop_ids:
                                    if len(self.seen_drop_ids) > 0: # don't dump initial batch as "new"
                                        fresh.append(d)
                                    self.seen_drop_ids.add(did)
                            if fresh:
                                self.new_drops_queue.extend(fresh)
                            self.live_drops = drops
            except Exception:
                pass

            time.sleep(2.5)

    def get_snapshot(self):
        with self._lock:
            fresh = list(self.new_drops_queue)
            self.new_drops_queue.clear()
            return {
                "online": self.online,
                "gamesCount": self.games_count,
                "liveDrops": list(self.live_drops),
                "newDrops": fresh
            }

if __name__ == "__main__":
    sync = UpgraderLiveSync()
    sync.start()
    print("Waiting 5 seconds for sync to populate...")
    time.sleep(5)
    snap = sync.get_snapshot()
    print(f"Online: {snap['online']}, Games Count: {snap['gamesCount']}, Live Drops: {len(snap['liveDrops'])}")
    if snap['liveDrops']:
        print("First drop item:", snap['liveDrops'][0]['item']['marketName'])
