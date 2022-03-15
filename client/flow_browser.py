import json
import webbrowser
from urllib.parse import urlencode
import secrets
import requests

from server_wait_for_callback import create_code_wait_server, wait_code_wait_server

#
# Does an OIDC flow expecting to need to do some real in browser HTML login/interactions
#

ISSUER = "http://localhost:3000"
CLIENT_ID = "client"
CLIENT_SECRET = "secret"
REDIRECT = "http://localhost:8888/callback"

create_code_wait_server()

# trigger the browser session asking for a login
auth_start_params={
    "response_type": "code",
    "client_id": CLIENT_ID,
    "redirect_uri": REDIRECT,
    "scope": "openid ga4gh",
    "state": "state" + secrets.token_urlsafe(16)
}

auth_start_url = f"{ISSUER}/auth?{urlencode(auth_start_params)}"

webbrowser.open_new_tab(auth_start_url)

# the browser session will end when the server sends the auth code to the redirect url
# we wait for that to happen
code = wait_code_wait_server()

# get the id and access tokens using the auth code
token_response = requests.post(
    f"{ISSUER}/token",
    data={
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    },
)

token_response.raise_for_status()

tokens = token_response.json()

if not tokens["id_token"]:
    print("No id_token returned")
    exit(1)

if not tokens["access_token"]:
    print("No access_token returned")
    exit(1)

userinfo_response = requests.get(
    f"{ISSUER}/userinfo",
    headers={"Authorization": f"Bearer {tokens['access_token']}"},
)

passport = userinfo_response.json()

print(json.dumps(passport, indent=2))
