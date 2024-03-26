// Ramping VUs up to 20 and then back to 0 over a persiod of 2 minutes.

export { addTaskAndQueryStatus } from "./common.js";

export const options = {
  scenarios: {
    addTaskAndQueryStatus: {
      exec: "addTaskAndQueryStatus",
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        {duration: "30s", target: 10},
        {duration: "30s", target: 20},
        {duration: "60s", target: 0},
      ],
      gracefulRampDown: "0s",
    },
  },
};
