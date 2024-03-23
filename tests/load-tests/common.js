import http from "k6/http";
import { sleep, check } from "k6";

const completedTaskRemoveProbability = 0.25;

async function addTask() {
  const response = http.post("http://localhost:8000/api/tasks/add");

  check(response, {
    "status code 200": (res) => res.status === 200,
    "content type JSON": (res) => res.headers["Content-Type"] === "application/json",
  });

  const responseData = response.json();

  check(responseData, {
    success: (resData) => resData.success === true,
    "result id": (resData) =>
      typeof resData.result !== "undefined" && typeof resData.result.id === "string" && resData.result.id.length > 0,
    "result message": (resData) => typeof resData.result !== "undefined" && resData.result.message === "Task queued.",
  });

  const newTaskId = responseData.result.id;
  console.log(`Added task: ${newTaskId}`);

  return newTaskId;
}

async function getTaskStatus(taskId) {
  const response = http.get(`http://localhost:8000/api/tasks/status/${taskId}`);

  check(response, {
    "status code 200": (res) => res.status === 200,
    "content type JSON": (res) => res.headers["Content-Type"] === "application/json",
  });

  const responseData = response.json();

  check(responseData, {
    success: (resData) => resData.success === true,
    "result progress status": (resData) =>
      typeof resData.result !== "undefined" && typeof resData.result.progress.status === "string",
    "result progress progress": (resData) =>
      typeof resData.result !== "undefined" && typeof resData.result.progress.progress === "string",
    "result progress timeElapsed": (resData) =>
      typeof resData.result !== "undefined" && typeof resData.result.progress.timeElapsed === "string",
  });

  console.log(`Fetched task: ${taskId}`);

  console.log("    ... Progress: " + responseData.result.progress.progress);

  return responseData.result.progress.status;
}

export async function addTaskAndQueryStatus() {
  const newTaskId = await addTask();
  sleep(2);

  while (true) {
    const taskStatus = await getTaskStatus(newTaskId);

    if (taskStatus === "Completed" && Math.random() <= completedTaskRemoveProbability) {
      console.log("    ... Completed.");
      break;
    }
    sleep(1);
  }
}
