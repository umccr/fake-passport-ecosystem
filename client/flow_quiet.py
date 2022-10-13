import requests
import sys
from server_wait_for_callback import create_code_wait_server, wait_code_wait_server

CONTROL = "http://localhost:3454"
ISSUER = "http://localhost:3455"
CLIENT_ID = "client"
CLIENT_SECRET = "secret"
REDIRECT = "http://localhost:8888/callback"

#
# Does an OIDC flow and finishes with a fetch of the userinfo endpoint
#

print('Generating', sys.argv[1], 'visa')

s = requests.Session()

createFixture = s.post(
    f"{CONTROL}/create",
    data={
        "scenario": "2022",
        "forceSubject": sys.argv[1],
        "forceAccept": True
    },
)

fixtureId = createFixture.json()['id']

setFixture = s.get(
    f"{ISSUER}/setFixture",
    params={
        "fixtureId": fixtureId
    }
)

create_code_wait_server()

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


code = wait_code_wait_server()

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

r3 = requests.get(
    f"{ISSUER}/userinfo",
    headers={"Authorization": f"Bearer {openid_flow_tokens['access_token']}"},
)

print(r3.json())
