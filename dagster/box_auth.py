"""Verify Box CCG authentication is working and print the authenticated user."""

import os
from dotenv import load_dotenv
from box_sdk_gen import BoxCCGAuth, BoxClient, CCGConfig

load_dotenv()

auth = BoxCCGAuth(
    config=CCGConfig(
        client_id=os.environ["BOX_CLIENT_ID"],
        client_secret=os.environ["BOX_CLIENT_SECRET"],
        user_id=os.environ["BOX_USER_ID"],
    )
)
client = BoxClient(auth=auth)
me = client.users.get_user_me()
print(f"Box CCG authenticated as: {me.login} (id={me.id})")
