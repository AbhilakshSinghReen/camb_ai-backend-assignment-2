from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .tasks import get_task_progress, long_task, update_task_progress, validate_task_id
from .utils import generate_task_id


app = FastAPI()


@app.post("/api/tasks/add")
def add_task():
    new_task_id = generate_task_id()
    update_task_progress(new_task_id, 0, 0)

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
