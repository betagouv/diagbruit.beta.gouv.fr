from dagster import Definitions, asset


@asset
def my_first_asset():
    return "hello"
