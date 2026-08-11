#!/usr/bin/env python3
"""Dev server for the SISTAFUND site — serves files with caching disabled
so the browser always shows the latest version of the code."""
import http.server

PORT = 8090


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('', PORT), NoCacheHandler).serve_forever()
