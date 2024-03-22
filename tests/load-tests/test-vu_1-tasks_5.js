export { addTask, getTaskStatus, teardown } from "./common.js";

export const options = {
  scenarios: {
    addTask: {
      exec: "addTask",
      executor: "constant-vus",
      duration: "10s",
      startTime: "0s",
      vus: 1,
    },
    getTaskStatus: {
      exec: "getTaskStatus",
      executor: "constant-vus",
      duration: "60s",
      startTime: "5s",
      vus: 1,
    },
  },
};
