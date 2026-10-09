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
    """
    Parses ONLY three metrics from the original site (https://upgrader.best):
    1. Online count (via wss://upgrader.best/api/ws)
    2. Total upgrades count (via https://upgrader.best/api/statistics/games-count)
    3. Best drop of the day (via https://upgrader.best/api/live-drops/best-hour)

    Syncs strictly every 10 minutes (600s) for optimal stability and performance.
    In between 10-minute syncs:
    - Total upgrades count increments smoothly (+1..3 every 30ms) so site feels live.
    - Online count has subtle natural micro-jitter (+-1..2).
    - Best drop of the day remains stable until the next 10-minute sync.
    """
    def __init__(self):
        self.online = 5800
        self.base_online = 5800
        self.games_count = 510846000
        self.best_live_drop = None
        self.last_sync_time = 0
        self.sync_interval = 600.0  # 10 minutes
        self._lock = threading.Lock()
        self._running = True

    def start(self):
        t_poll = threading.Thread(target=self._poll_worker, daemon=True)
        t_poll.start()
        t_tick = threading.Thread(target=self._ticker_worker, daemon=True)
        t_tick.start()

    def sync_from_original_site(self):
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

        # 1. PARSE ONLINE (from wss://upgrader.best/api/ws)
        parsed_online = None
        try:
            async def get_online():
                headers = [
                    ('Origin', 'https://upgrader.best'),
                    ('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
                ]
                async with websockets.connect('wss://upgrader.best/api/ws', ssl=ssl_ctx, additional_headers=headers) as ws:
                    await ws.send(json.dumps({'id': 'poll_online', 'event': 'online'}))
                    resp = await asyncio.wait_for(ws.recv(), timeout=5.0)
                    data = json.loads(resp)
                    return data.get('data')

            loop = asyncio.new_event_loop()
            parsed_online = loop.run_until_complete(get_online())
            loop.close()
        except Exception as e:
            print(f"[UpgraderLiveSync] Notice: could not fetch online: {e}")

        # 2. PARSE UPGRADES COUNT (from https://upgrader.best/api/statistics/games-count)
        parsed_games = None
        try:
            req = urllib.request.Request(
                "https://upgrader.best/api/statistics/games-count",
                headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
            )
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=5) as r:
                res = json.loads(r.read().decode())
                parsed_games = res.get("count")
        except Exception as e:
            print(f"[UpgraderLiveSync] Notice: could not fetch games-count: {e}")

        # 3. PARSE BEST DROP OF THE DAY (from https://upgrader.best/api/live-drops/best-hour)
        parsed_best = None
        try:
            req = urllib.request.Request(
                "https://upgrader.best/api/live-drops/best-hour",
                headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
            )
            with urllib.request.urlopen(req, context=ssl_ctx, timeout=5) as r:
                res = json.loads(r.read().decode())
                parsed_best = res.get("bestLiveDrop")
        except Exception as e:
            print(f"[UpgraderLiveSync] Notice: could not fetch best-hour: {e}")

        with self._lock:
            if isinstance(parsed_online, int) and parsed_online > 0:
                self.online = parsed_online
                self.base_online = parsed_online

            if isinstance(parsed_games, int) and parsed_games > 0:
                self.games_count = max(self.games_count, parsed_games)

            if parsed_best and isinstance(parsed_best, dict) and "item" in parsed_best:
                u = parsed_best.setdefault("user", {})
                uid = str(u.get("id") or "2148065")
                unick = u.get("nickname") or "Mikey"
                u["id"] = uid
                u["nickname"] = unick
                if not u.get("avatar") and not u.get("image"):
                    h = 0
                    for ch in uid:
                        h = ((h << 5) - h) + ord(ch)
                        h &= 0xFFFFFFFF
                    av_idx = (abs(h) % 149) + 1
                    u["avatar"] = f"/assets/avatars/user_pack/avatar_{av_idx}.jpg"
                    u["image"] = u["avatar"]
                self.best_live_drop = parsed_best

            self.last_sync_time = time.time()
            best_name = self.best_live_drop.get("item", {}).get("marketName") if self.best_live_drop else "None"
            best_user = self.best_live_drop.get("user", {}).get("nickname") if self.best_live_drop else "None"
            print(f"[UpgraderLiveSync] Synced from upgrader.best! Online: {self.online}, Upgrades: {self.games_count}, Best Drop: {best_name} ({best_user})")

    def _poll_worker(self):
        while self._running:
            self.sync_from_original_site()
            # Sleep 10 minutes (600 seconds) in 1s slices for clean server exit
            for _ in range(int(self.sync_interval)):
                if not self._running:
                    break
                time.sleep(1.0)

    def _ticker_worker(self):
        import random
        last_online_jitter = time.time()
        while self._running:
            time.sleep(0.03)  # smooth ~33 ticks/sec
            delta = random.choice([1, 1, 2, 2, 3])
            now = time.time()
            with self._lock:
                self.games_count += delta
                if now - last_online_jitter >= 2.5:
                    last_online_jitter = now
                    jitter = random.choice([-2, -1, 0, 1, 2])
                    self.online = max(100, self.base_online + jitter)

    def get_snapshot(self):
        with self._lock:
            return {
                "online": self.online,
                "gamesCount": self.games_count,
                "bestLiveDrop": self.best_live_drop,
                "lastSync": self.last_sync_time,
                "syncInterval": self.sync_interval
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

        if parsed.path in ['/api/statistics/online', '/statistics/online']:
            return self.send_json({"data": LIVE_SYNC.online, "event": "online"})

        if parsed.path in ['/api/live-drops/best-hour', '/live-drops/best-hour']:
            snap = LIVE_SYNC.get_snapshot()
            best = snap.get("bestLiveDrop")
            return self.send_json({"bestLiveDrop": best} if best else {"bestLiveDrop": None})

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
