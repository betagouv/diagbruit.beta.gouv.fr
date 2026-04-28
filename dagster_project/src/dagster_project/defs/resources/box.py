from dagster import ConfigurableResource
from box_sdk_gen import BoxClient, BoxCCGAuth, CCGConfig

class BoxResource(ConfigurableResource):
    client_id: str
    client_secret: str
    enterprise_id: str

    def get_client(self) -> BoxClient:
        config = CCGConfig(
            client_id=self.client_id,
            client_secret=self.client_secret,
            enterprise_id=self.enterprise_id,
        )
        auth = BoxCCGAuth(config=config)
        return BoxClient(auth=auth)