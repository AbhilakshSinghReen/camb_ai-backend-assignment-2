from os import environ

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import prometheus_client

from .tasks import get_task_progress, long_task, update_task_progress, validate_task_id
from .utils import generate_task_id

# Expose Prometheus metrics at the specified port.
METRICS_PORT = int(environ["METRICS_PORT"])
prometheus_client.start_http_server(METRICS_PORT)

app = FastAPI()


@app.post("/api/tasks/add")
def add_task():
    """
    Add a task to the Queue.

    Args:
        -

    Returns:
        JSONResponse: A JSON response containing the task id of the newly added task along with a message 
        saying that the task has been queued.
    """
        
    new_task_id = generate_task_id()
    update_task_progress(new_task_id, 0, 0, status="Queued")

    long_task(new_task_id)
    
    return JSONResponse(status_code=200, content={
        'success': True,
        'result': {
            "id": new_task_id,
            'message': "Task queued.",
        },
    })


@app.get("/api/tasks/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Add a task to the Queue.

    Args:
        task_id (str): id of the task whose status is to be retrieved

    Returns:
        JSONResponse: A JSON response containing the progress of the task with the given id.
        If the task does not exist, a JSON Response with error message saying Task Not Found is returned.
    """

    if not validate_task_id(task_id):
        return JSONResponse(status_code=404, content={
            'success': False,
            'error': {
                'message': "Task not found.",
            },
        })
    
    task_progress = get_task_progress(task_id)
    
    return JSONResponse(status_code=200, content={
        'success': True,
        'result': {
            'progress': task_progress,
        },
    })
