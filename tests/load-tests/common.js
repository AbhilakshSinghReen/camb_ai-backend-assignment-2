import http from "k6/http";
import exec from "k6/execution";
import redis from "k6/experimental/redis";
import { sleep, check } from "k6";

const redisClient = new redis.Client("redis://localhost:6379");
const tasksSetName = "tests-tasks-in-progress";
const completedTaskRemoveProbability = 0.25;

export async function addTask() {
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
  await redisClient.sadd(tasksSetName, newTaskId);
  console.log(`Added task to store: ${newTaskId}`);

  sleep(3);
}

export async function getTaskStatus() {
  const allTaskIds = await redisClient.smembers(tasksSetName);
  if (allTaskIds.length === 0) {
    exec.test.abort()
    sleep(1);
    return;
  }

  const randomFetchedTaskId = await redisClient.srandmember(tasksSetName);
  console.log(`Fetched task from store: ${randomFetchedTaskId}`);

  const response = http.get(`http://localhost:8000/api/tasks/status/${randomFetchedTaskId}`);

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

  console.log("    ... Progress: " + responseData.result.progress.progress);

    //   Remove the task based on some probability
    if (
      (responseData.result.progress.status === "Completed" || responseData.result.progress.status === "Failed") &&
      Math.random() <= completedTaskRemoveProbability
    ) {
      await redisClient.srem(tasksSetName, randomFetchedTaskId);
      console.log(`    ... Removed task from store: ${randomFetchedTaskId}`);
    }

  sleep(0.5);
}

export async function teardown() {
  await redisClient.del(tasksSetName);
}
