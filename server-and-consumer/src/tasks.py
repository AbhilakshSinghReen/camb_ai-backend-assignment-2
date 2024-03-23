from json import dumps as json_dumps, loads as json_loads
from os import environ
from time import time

from huey import RedisHuey

from .redis_client import redis_client


REDIS_HOST = environ["REDIS_HOST"]

huey = RedisHuey("entrypoint", host=REDIS_HOST)

task_status_map_key = "long_tasks"
task_length = 100_000_000
task_num_intervals = 100


def validate_task_id(task_id):
    progress_str = redis_client.hget(task_status_map_key, task_id)
    return progress_str is not None


def get_task_progress(task_id):
    progress_str = redis_client.hget(task_status_map_key, task_id)
    if progress_str is None:
        return {
            'message': "Task not found."
        }
    
    return json_loads(progress_str)


def update_task_progress(task_id, time_elapsed, progress_percentage, status="Processing"):
    task_progress = {
        'status': status,
        'timeElapsed': str(round(time_elapsed, 4)),
        'progress': str(round(progress_percentage, 4)),
    }
    task_progress_str = json_dumps(task_progress)

    redis_client.hset(task_status_map_key, task_id, task_progress_str)


def mark_task_as_failed(task_id, time_elapsed=None, progress_percentage=None):
    task_progress = get_task_progress(task_id)

    if time_elapsed is not None:
        task_progress['timeElapsed'] = str(round(time_elapsed, 4))
    
    if progress_percentage is not None:
        task_progress['progress'] = str(round(progress_percentage, 4))

    task_progress['status'] = "Failed"
    task_progress['failedAt'] = task_progress['progress']
    
    task_progress_str = json_dumps(task_progress)

    redis_client.hset(task_status_map_key, task_id, task_progress_str)


@huey.task()
def long_task(task_id: str):
    progress_update_interval = task_length / task_num_intervals

    start_time = time()

    update_task_progress(task_id, 0, 0)

    count = 0
    for i in range(1, task_length + 1):
        try:
            count += 1

            if i % progress_update_interval == 0:
                time_elapsed = time() - start_time
                progress_percentage = (count / task_length) * 100
                update_task_progress(task_id, time_elapsed, progress_percentage)
        except:
            time_elapsed = time() - start_time
            progress_percentage = (count / task_length) * 100
            
            mark_task_as_failed(task_id, time_elapsed, progress_percentage)
    
    time_elapsed = time() - start_time
    update_task_progress(task_id, time_elapsed, 100, status="Completed")


if __name__ == "__main__":
    print("foo")