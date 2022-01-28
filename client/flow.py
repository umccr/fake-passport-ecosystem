import threading
import urllib
from time import sleep

import requests

#
# Does an OIDC flow and finishes with a fetch of the userinfo endpoint
#

#ISSUER = "http://localhost:3000"
ISSUER = "https://jtbpmjfzfjngtzqz.aai.nagim.dev"
CLIENT_ID = "abcd"
CLIENT_SECRET = "xyzz"
REDIRECT = "http://localhost:8888/callback"

code = None


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
                parsed = urllib.parse.parse_qs(self.path[len(EXPECTED_PATH_PREFIX) :])
                if parsed["code"]:
                    code = parsed["code"]
            self.send_response(200, "OK")
            self.end_headers()
            self.wfile.write("It works!".encode("utf-8"))

    with Server(("", 8888), Handler) as httpd:
        global code
        while not code:
            httpd.handle_request()


# Start the server in a new thread
daemon = threading.Thread(name="daemon_server", target=start_server)
daemon.setDaemon(
    True
)  # Set as a daemon so it will be killed once the main thread is dead.
daemon.start()

s = requests.Session()

r = s.get(
    f"{ISSUER}/auth",
    params={
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT,
        "scope": "openid ga4gh",
        "state": "aaaa",
    }
)

for i in range(1, 10):
    if not code:
        sleep(10)

r2 = s.post(
    f"{ISSUER}/token",
    data={
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    },
)

# print(s.cookies.items())

openid_flow_tokens = r2.json()

print("Passport = ")
print(openid_flow_tokens["id_token"])

s = requests.Session()

r3 = s.get(
    f"{ISSUER}/me",
    headers={"Authorization": f"Bearer {openid_flow_tokens['access_token']}"},
)

print(r3.json())
