// 35 VUs making 3 iterations each

export { addTaskAndQueryStatus } from "./common.js";

export const options = {
  scenarios: {
    addTaskAndQueryStatus: {
      exec: "addTaskAndQueryStatus",
      executor: "per-vu-iterations",
      vus: 35,
      iterations: 3,
    },
  },
};
