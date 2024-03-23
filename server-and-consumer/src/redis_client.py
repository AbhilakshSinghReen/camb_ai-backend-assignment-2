from os import environ

from redis import Redis


REDIS_HOST = environ["REDIS_HOST"]
REDIS_PORT = int(environ["REDIS_PORT"])
REDIS_DB = (environ["REDIS_DB"])
REDIS_PASSWORD = environ.get("REDIS_PASSWORD", None)

redis_client = Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, password=REDIS_PASSWORD, decode_responses=True)
