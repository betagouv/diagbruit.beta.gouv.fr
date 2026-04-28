from dagster import ConfigurableResource
from box_sdk_gen import BoxClient, BoxJWTAuth, JWTConfig

class BoxResource(ConfigurableResource):
    client_id: str
    client_secret: str
    jwt_key_id: str
    private_key: str
    private_key_passphrase: str
    user_id: str

    def get_client(self) -> BoxClient:
        config = JWTConfig(
            client_id=self.client_id,
            client_secret=self.client_secret,
            jwt_key_id=self.jwt_key_id,
            private_key=self.private_key,
            private_key_passphrase=self.private_key_passphrase,
            user_id=self.user_id,
        )
        auth = BoxJWTAuth(config=config)
        return BoxClient(auth=auth)