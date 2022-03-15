import threading
import urllib
from time import sleep
from typing import Optional
from urllib.parse import urlencode

code: Optional[str] = None


def create_code_wait_server(port: int = 8888) -> None:
    def start_server():
        import http.server
        import socketserver

        class Server(socketserver.TCPServer):
            # Avoid "address already used" error when frequently restarting the script
            allow_reuse_address = True

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                global code
                EXPECTED_PATH_PREFIX = "/callback?"
                if self.path.startswith(EXPECTED_PATH_PREFIX):
                    parsed = urllib.parse.parse_qs(self.path[len(EXPECTED_PATH_PREFIX):])
                    if parsed["state"]:
                        state = parsed["state"]
                    if parsed["code"]:
                        code = parsed["code"]
                self.send_response(200, "OK")
                self.end_headers()
                if code:
                    self.wfile.write(
                        "Callback page - auth code has been captured so now this page can be closed".encode("utf-8"))
                else:
                    self.wfile.write("Callback page - auth code WAS NOT PRESENT ON CALLBACK".encode("utf-8"))

        with Server(("", port), Handler) as httpd:
            global code
            while not code:
                httpd.handle_request()

    # Start the server in a new thread
    daemon = threading.Thread(name="daemon_server", target=start_server, daemon=True)
    daemon.start()


def wait_code_wait_server() -> str:
    for i in range(1, 10):
        if not code:
            print(".")
            sleep(6)

    if not code:
        raise Exception("Code not received in time")

    return code
