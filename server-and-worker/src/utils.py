from uuid import uuid4
from time import time


def generate_task_id():
    return str(uuid4()) + "---" + str(time())
