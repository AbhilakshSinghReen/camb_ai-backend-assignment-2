// Single User Sequential: Add Task, Fetch Progress until completion, Repeat 5 times

export { addTaskAndQueryStatus } from "./common.js";

export const options = {
  scenarios: {
    addTaskAndQueryStatus: {
      exec: "addTaskAndQueryStatus",
      executor: "shared-iterations",
      vus: 5,
      iterations: 10,
    },
  },
};
