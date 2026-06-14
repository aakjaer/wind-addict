#!/usr/bin/env python3
"""
Tiny local server for the Sjælland Wind dashboard.

- Serves the static files in this folder (index.html etc.)
- Proxies /api/dmi/* to https://opendataapi.dmi.dk/* so the browser
  doesn't hit DMI's CORS restrictions directly.

Run:
    python3 server.py

Then open:
    http://localhost:8000
"""

import http.server
import socketserver
import urllib.request
import urllib.error

PORT = 8000
DMI_BASE = "https://opendataapi.dmi.dk"
PROXY_PREFIX = "/api/dmi"


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith(PROXY_PREFIX):
            self.proxy_to_dmi()
        else:
            super().do_GET()

    def proxy_to_dmi(self):
        target_url = DMI_BASE + self.path[len(PROXY_PREFIX):]
        try:
            req = urllib.request.Request(target_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(f'{{"error": "{e}"}}'.encode("utf-8"))


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving on http://localhost:{PORT}")
        httpd.serve_forever()
