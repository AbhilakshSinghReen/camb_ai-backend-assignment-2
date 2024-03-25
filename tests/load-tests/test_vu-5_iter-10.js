// 5 VUs making 10 Shared Iters

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
