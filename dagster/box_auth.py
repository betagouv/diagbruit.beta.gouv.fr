"""Run once to authenticate with Box via OAuth2 and store the token in Postgres."""

import http.server
import os
import urllib.parse
import webbrowser
from dotenv import load_dotenv
from box_sdk_gen import BoxOAuth, OAuthConfig, GetAuthorizeUrlOptions

from dagster_project.defs.resources.box import PostgresTokenStorage
from dagster_project.io.db import db_url

REDIRECT_URI = "http://localhost:8888"

load_dotenv()

db_url = db_url()
storage = PostgresTokenStorage(db_url)

auth = BoxOAuth(
    config=OAuthConfig(
        client_id=os.environ["BOX_CLIENT_ID"],
        client_secret=os.environ["BOX_CLIENT_SECRET"],
        token_storage=storage,
    )
)

auth_url = auth.get_authorize_url(
    options=GetAuthorizeUrlOptions(redirect_uri=REDIRECT_URI)
)
print(f"\nOpening browser for Box login...\n{auth_url}\n")
webbrowser.open(auth_url)

code_holder = [None]


class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        code_holder[0] = params.get("code", [None])[0]
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Authentication successful! You can close this tab.")

    def log_message(self, *_args):
        pass


print("Waiting for Box to redirect...")
http.server.HTTPServer(("localhost", 8888), CallbackHandler).handle_request()

auth.get_tokens_authorization_code_grant(code_holder[0])
print("Authenticated. Token saved to Postgres (box_tokens table).")
