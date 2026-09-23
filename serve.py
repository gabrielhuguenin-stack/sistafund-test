#!/usr/bin/env python3
"""Dev server for the SISTAFUND site — serves files with caching disabled
so the browser always shows the latest version of the code. It also serves
clean URLs (/manifesto → manifesto.html), the way the OVH server does via .htaccess."""
import http.server
import os
from urllib.parse import urlparse, unquote

PORT = 8090


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def _clean_url(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path.endswith('/') or path == '':
            return
        fs = self.translate_path(self.path)
        if not os.path.exists(fs) and os.path.isfile(fs + '.html'):
            self.path = unquote(path) + '.html' + (('?' + parsed.query) if parsed.query else '')

    def do_GET(self):
        self._clean_url()
        super().do_GET()

    def do_HEAD(self):
        self._clean_url()
        super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('', PORT), NoCacheHandler).serve_forever()
