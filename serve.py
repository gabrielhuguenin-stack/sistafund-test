#!/usr/bin/env python3
import http.server
import os
from urllib.parse import urlparse, unquote

PORT = 8090


class Handler(http.server.SimpleHTTPRequestHandler):
    def _clean(self):
        parsed = urlparse(self.path)
        if parsed.path.endswith('/') or parsed.path == '':
            return
        fs = self.translate_path(self.path)
        if not os.path.exists(fs) and os.path.isfile(fs + '.html'):
            self.path = unquote(parsed.path) + '.html' + (('?' + parsed.query) if parsed.query else '')

    def do_GET(self):
        self._clean()
        super().do_GET()

    def do_HEAD(self):
        self._clean()
        super().do_HEAD()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('', PORT), Handler).serve_forever()
