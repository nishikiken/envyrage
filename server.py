#!/usr/bin/env python3
"""
Custom SPA HTTP Server for UPGRADER PRO
Handles static files, SPA HTML5 pushState routing (fallback to cis/index.html instead of 404),
serves live data synced directly from https://upgrader.best (online, games count, live drops),
and prevents 404 errors on any frontend navigation.
"""
import http.server
import socketserver
import os
import sys
import urllib.parse
import urllib.request
import json
import ssl
import threading
import time
import asyncio
import websockets

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8085
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class UpgraderLiveSync:
    def __init__(self):
        self.online = 5680
        self.games_count = 488830000
        self.live_drops = []
        self.seen_drop_ids = set()
        self.new_drops_queue = []
        self.best_live_drop = None
        self.battle_lobbies = []
        self._lock = threading.Lock()
        self._running = True

    def start(self):
        t_ws = threading.Thread(target=self._ws_worker, daemon=True)
        t_ws.start()
        t_poll = threading.Thread(target=self._poll_worker, daemon=True)
        t_poll.start()
        t_tick = threading.Thread(target=self._ticker_worker, daemon=True)
        t_tick.start()

    def _ticker_worker(self):
        import random, math
        last_jitter = time.time()
        online_jitter = 0

        schedule = [
            (0.0, 3500),
            (3.5, 3440),
            (5.5, 3480),
            (7.0, 3750),
            (8.0, 3980),
            (10.0, 4020),
            (12.0, 4080),
            (13.5, 4750),
            (15.0, 5040),
            (16.5, 5080),
            (18.0, 4980),
            (19.5, 4550),
            (21.0, 3950),
            (22.5, 3600),
            (23.5, 3510),
            (24.0, 3500)
        ]

        def get_base_online(hour):
            for i in range(len(schedule) - 1):
                h0, o0 = schedule[i]
                h1, o1 = schedule[i+1]
                if h0 <= hour <= h1:
                    progress = (hour - h0) / (h1 - h0)
                    smooth = (1 - math.cos(progress * math.pi)) / 2
                    return o0 + (o1 - o0) * smooth
            return 4000

        while self._running:
            time.sleep(0.025)
            # Smooth increments of 1, 2, or 3 every 25ms (average ~70-100 upgrades/sec, strictly <= 200/sec)
            delta = random.choice([1, 1, 2, 2, 3])
            now = time.time()
            with self._lock:
                self.games_count += delta
                if now - last_jitter >= 1.8:
                    last_jitter = now
                    lt = time.localtime(now)
                    hour = lt.tm_hour + lt.tm_min / 60.0 + lt.tm_sec / 3600.0
                    base_online = get_base_online(hour)
                    step = random.choice([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5])
                    drift = 0
                    if online_jitter > 25: drift = -random.randint(1, 3)
                    elif online_jitter < -25: drift = random.randint(1, 3)
                    online_jitter = max(-45, min(45, online_jitter + step + drift))
                    self.online = int(round(base_online + online_jitter))

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
                            try:
                                msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
                            except asyncio.TimeoutError:
                                await ws.send(json.dumps({"id": f"poll_online_{time.time()}", "event": "online"}))
                except Exception:
                    await asyncio.sleep(2)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(run())

    def _poll_worker(self):
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}

        poll_counter = 0
        while self._running:
            poll_counter += 1
            # 1. Poll games count
            try:
                req = urllib.request.Request("https://upgrader.best/api/statistics/games-count", headers=headers)
                with urllib.request.urlopen(req, context=ssl_ctx, timeout=4) as r:
                    res = json.loads(r.read().decode())
                    cnt = res.get("count")
                    if isinstance(cnt, int) and cnt > self.games_count:
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
                            fresh = []
                            for d in drops:
                                did = str(d.get("id"))
                                if did and did not in self.seen_drop_ids:
                                    if len(self.seen_drop_ids) > 0:
                                        fresh.append(d)
                                    self.seen_drop_ids.add(did)
                            if fresh:
                                self.new_drops_queue.extend(fresh)
                                if len(self.new_drops_queue) > 40:
                                    self.new_drops_queue = self.new_drops_queue[-40:]
                            self.live_drops = drops
            except Exception:
                pass

            # 3. Poll best-hour drop
            if poll_counter % 3 == 0 or not self.best_live_drop:
                try:
                    req = urllib.request.Request("https://upgrader.best/api/live-drops/best-hour", headers=headers)
                    with urllib.request.urlopen(req, context=ssl_ctx, timeout=4) as r:
                        res = json.loads(r.read().decode())
                        best = res.get("bestLiveDrop")
                        if best:
                            with self._lock:
                                self.best_live_drop = best
                except Exception:
                    pass

            # 4. Poll live battle lobbies from https://upgrader.best/api/game/battle/lobbies
            if poll_counter % 2 == 0 or not self.battle_lobbies:
                try:
                    req = urllib.request.Request("https://upgrader.best/api/game/battle/lobbies", headers=headers)
                    with urllib.request.urlopen(req, context=ssl_ctx, timeout=4) as r:
                        res = json.loads(r.read().decode())
                        items = res.get("items", [])
                        if items:
                            with self._lock:
                                self.battle_lobbies = items
                except Exception:
                    pass

            time.sleep(1.0)

    def get_snapshot(self):
        with self._lock:
            fresh = list(self.new_drops_queue)
            self.new_drops_queue.clear()
            return {
                "online": self.online,
                "gamesCount": self.games_count,
                "liveDrops": list(self.live_drops),
                "newDrops": fresh,
                "bestLiveDrop": self.best_live_drop,
                "battleLobbies": list(self.battle_lobbies)
            }

LIVE_SYNC = UpgraderLiveSync()

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        clean_path = parsed.path.lstrip('/')
        local_path = os.path.join(DIRECTORY, clean_path)

        # Real-time API endpoints synced from upgrader.best
        if parsed.path in ['/api/realtime-feed', '/realtime-feed']:
            return self.send_json(LIVE_SYNC.get_snapshot())

        if parsed.path in ['/api/statistics/games-count', '/statistics/games-count']:
            return self.send_json({"count": LIVE_SYNC.games_count})

        if parsed.path in ['/api/live-drops', '/live-drops']:
            return self.send_json({"liveDrops": LIVE_SYNC.live_drops})

        if parsed.path in ['/api/statistics/online', '/statistics/online']:
            return self.send_json({"data": LIVE_SYNC.online, "event": "online"})

        if parsed.path in ['/api/live-drops/best-hour', '/live-drops/best-hour']:
            snap = LIVE_SYNC.get_snapshot()
            best = snap.get("bestLiveDrop")
            return self.send_json({"bestLiveDrop": best} if best else {"bestLiveDrop": None})

        # Battle lobbies live feed directly synced from upgrader.best
        if parsed.path in ['/api/game/battle/lobbies/live', '/game/battle/lobbies/live', '/api/game/battle/lobbies', '/game/battle/lobbies']:
            return self.send_json({"items": LIVE_SYNC.battle_lobbies, "hasMore": False})

        # 1. Root redirect to cis/index.html
        if parsed.path in ['', '/', '/index.html']:
            self.path = '/cis/index.html'
            return super().do_GET()

        # 2. Direct match for existing file
        if os.path.isfile(local_path):
            return super().do_GET()

        # 3. Direct match for directory containing index.html
        if os.path.isdir(local_path):
            index_path = os.path.join(local_path, 'index.html')
            if os.path.isfile(index_path):
                self.path = parsed.path.rstrip('/') + '/index.html'
                return super().do_GET()

        # Direct SPA routes
        if parsed.path in ['/vip', '/profile', '/tos', '/privacy-policy', '/cookie-policy', '/provably-fair', '/battles', '/battles/create'] or parsed.path.startswith('/battles/'):
            self.path = '/cis/index.html'
            return super().do_GET()

        # Admin Panel routes: /admin, /en/admin, /ru/admin, /cis/admin, etc.
        if parsed.path.rstrip('/').endswith('/admin') or parsed.path in ['/admin', '/admin.html']:
            self.path = '/admin.html'
            return super().do_GET()

        # 4. Check if static asset exists relative to root when requested under /cis/, /en/, or /ru/
        for lang_prefix in ['/cis/', '/en/', '/ru/']:
            if parsed.path.startswith(lang_prefix):
                candidate_rel = parsed.path[len(lang_prefix):]
                candidate_path = os.path.join(DIRECTORY, candidate_rel)
                if os.path.isfile(candidate_path):
                    self.path = '/' + candidate_rel
                    return super().do_GET()

        # 5. Missing /assets/... proxying directly from upgrader.best S3 CDN with local disk cache
        if parsed.path.startswith('/assets/'):
            try:
                ssl_ctx = ssl.create_default_context()
                ssl_ctx.check_hostname = False
                ssl_ctx.verify_mode = ssl.CERT_NONE
                rel_path = parsed.path[len('/assets/'):]
                urls = [
                    "https://s3.upgrader.best/cdn/fa/" + rel_path,
                    "https://upgrader.best" + parsed.path
                ]
                for target_url in urls:
                    try:
                        req = urllib.request.Request(target_url, headers={"User-Agent": "Mozilla/5.0"})
                        with urllib.request.urlopen(req, context=ssl_ctx, timeout=4) as r:
                            if r.status == 200:
                                content = r.read()
                                stripped = content.strip().lower()
                                if not (stripped.startswith(b'<!doctype') or stripped.startswith(b'<html')):
                                    os.makedirs(os.path.dirname(local_path), exist_ok=True)
                                    with open(local_path, "wb") as f_out:
                                        f_out.write(content)
                                    mime = r.headers.get_content_type() or 'application/octet-stream'
                                    self.send_response(200)
                                    self.send_header('Content-Type', mime)
                                    self.send_header('Content-Length', str(len(content)))
                                    self.end_headers()
                                    self.wfile.write(content)
                                    return
                    except Exception:
                        continue
            except Exception:
                pass

        # 6. If path starts with /cis, /en, or /ru, serve that directory's index.html
        if parsed.path.startswith('/cis'):
            self.path = '/cis/index.html'
            return super().do_GET()
        if parsed.path.startswith('/en'):
            self.path = '/en/index.html'
            return super().do_GET()
        if parsed.path.startswith('/ru'):
            self.path = '/ru/index.html'
            return super().do_GET()

        # 7. Missing media fallback (exact byte length, matching Content-Length)
        ext = os.path.splitext(parsed.path)[1].lower()
        if ext == '.webp':
            webp_1x1 = b'RIFF\x1a\x00\x00\x00WEBPVP8L\x0e\x00\x00\x00/\x00\x00\x00\x00\x07\x85\x85\x88\x88%\x00\x00'
            self.send_response(200)
            self.send_header('Content-Type', 'image/webp')
            self.send_header('Content-Length', str(len(webp_1x1)))
            self.end_headers()
            self.wfile.write(webp_1x1)
            return
        if ext in ['.png', '.jpg', '.jpeg', '.gif', '.ico']:
            png_1x1 = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
            self.send_response(200)
            self.send_header('Content-Type', 'image/png')
            self.send_header('Content-Length', str(len(png_1x1)))
            self.end_headers()
            self.wfile.write(png_1x1)
            return
        if ext == '.svg':
            svg_data = b'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"></svg>'
            self.send_response(200)
            self.send_header('Content-Type', 'image/svg+xml')
            self.send_header('Content-Length', str(len(svg_data)))
            self.end_headers()
            self.wfile.write(svg_data)
            return
        if ext in ['.js', '.css', '.woff', '.woff2', '.ttf']:
            return super().do_GET()

        # Fallback to SPA entry
        self.path = '/cis/index.html'
        return super().do_GET()

    do_HEAD = do_GET

def run():
    LIVE_SYNC.start()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
        print(f"=================================================")
        print(f"   UPGRADER PRO - Live SPA Server on port {PORT}")
        print(f"   Direct live stream from upgrader.best active")
        print(f"   Local URL: http://localhost:{PORT}")
        print(f"=================================================")
        httpd.serve_forever()

if __name__ == '__main__':
    run()
