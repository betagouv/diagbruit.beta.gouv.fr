from dagster import ConfigurableResource
from box_sdk_gen import BoxCCGAuth, BoxClient, CCGConfig


class BoxResource(ConfigurableResource):
    client_id: str
    client_secret: str
    enterprise_id: str

    def get_client(self) -> BoxClient:
        auth = BoxCCGAuth(
            config=CCGConfig(
                client_id=self.client_id,
                client_secret=self.client_secret,
                enterprise_id=self.enterprise_id,
            )
        )
        return BoxClient(auth=auth)