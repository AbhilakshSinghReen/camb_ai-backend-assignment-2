// 20 VUs making 50 Shared Iters

export { addTaskAndQueryStatus } from "./common.js";

export const options = {
  scenarios: {
    addTaskAndQueryStatus: {
      exec: "addTaskAndQueryStatus",
      executor: "shared-iterations",
      vus: 20,
      iterations: 50,
    },
  },
};
