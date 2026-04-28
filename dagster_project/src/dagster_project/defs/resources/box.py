from dagster import ConfigurableResource
from box_sdk_gen import BoxClient, BoxOAuth, OAuthConfig, AccessToken
from box_sdk_gen.box.token_storage import TokenStorage
from sqlalchemy import create_engine, text


class PostgresTokenStorage(TokenStorage):
    def __init__(self, db_url: str, key: str = "box"):
        self.engine = create_engine(db_url)
        self.key = key
        with self.engine.connect() as conn:
            conn.execute(text(
                "CREATE TABLE IF NOT EXISTS box_tokens "
                "(key TEXT PRIMARY KEY, token TEXT)"
            ))
            conn.commit()

    def store(self, token: AccessToken) -> None:
        with self.engine.connect() as conn:
            conn.execute(text(
                "INSERT INTO box_tokens (key, token) VALUES (:k, :t) "
                "ON CONFLICT (key) DO UPDATE SET token = :t"
            ), {"k": self.key, "t": token.access_token})
            conn.commit()

    def get(self) -> AccessToken | None:
        with self.engine.connect() as conn:
            row = conn.execute(
                text("SELECT token FROM box_tokens WHERE key = :k"),
                {"k": self.key}
            ).fetchone()
        return AccessToken(access_token=row[0]) if row else None

    def clear(self) -> None:
        with self.engine.connect() as conn:
            conn.execute(
                text("DELETE FROM box_tokens WHERE key = :k"),
                {"k": self.key}
            )
            conn.commit()


class BoxResource(ConfigurableResource):
    client_id: str
    client_secret: str
    db_url: str

    def get_client(self) -> BoxClient:
        auth = BoxOAuth(
            config=OAuthConfig(
                client_id=self.client_id,
                client_secret=self.client_secret,
                token_storage=PostgresTokenStorage(self.db_url),
            )
        )
        return BoxClient(auth=auth)