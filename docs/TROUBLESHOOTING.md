## KEDA can't connect to Redis
Let us assume you have a `keda-operator` running in the namespace `keda` and a `ScaledObject` in the namespace `my-namespace`. Let's say the `ScaledObject` has a `Redis` trigger at `my-namespace-redis-master:6379`.

In this case, the `keda-operator` running in the `keda` namespace would be unable to connect to the `Redis` instance running in the `my-namespace` namespace.

The following 2 problems make it worse:
1) [KEDA in Multiple Namespaces](https://github.com/kedacore/keda/discussions/1761)
2) [ScaledObject namespace unable to resolve DNS](https://github.com/kedacore/keda/discussions/977)

A quick and easy way to circumvent this would be to have the `keda-operator` in the same namespace as your `ScaledObject` and trigger host.
But, this means that you would only be able to have one namespace in your Cluster that can make use of `KEDA`.

## Grafana Can't Connect to Loki
Once we have set up our monitoring stack, we perform tests in the `Grafana` UI to check if we can connect with `Prometheus` and `Loki`.
If one of these tests fails, for example `Loki`, we can debug using the following process.

### Loki Works in Browser but Test Fails in Grafana
The first thing to be done is to verify if Loki is actually up and running.
Assuming you have deployed the `loki-stack` in the namespace `monitoring` and the release name `loki-stack`, ew can get the `Loki` service using:
```
kubectl get services --namespace monitoring | grep loki-stack-loki
```
We want the `loki-stack-loki` service and not the `headless` or the `memberlist` ones.

If you've followed the [DEPLOYMENT.md](./DEPLOYMENT.md), the namespace will be `keda-monitoring` and the release name will be `monitoring-stack`. Run the following command to get the service.
```
kubectl --namespace keda-monitoring get services | grep monitoring-stack-loki
```

You should see the service listening at TCP Port 3100.

Let us port forward to this service:
```
kubectl --namespace keda-monitoring port-forward services/monitoring-stack-loki 3100:3100
```

Open up `http://localhost:3100/metrics` in your web browser. If you get a response, it means that the Loki server is up and running.

#### Loki Image Version
(This is just one example problem that I encountered.)
This is another problem with the `loki-stack` Helm Chart. Take a look at [This Issue](https://github.com/grafana/loki/issues/11893) for more details.

Run the following command to get the pods in your namespace.
```
kubectl --namespace keda-monitoring get pods
```

We're looking for a pod with the prefix `monitoring-stack-loki`, most likely `monitoring-stack-loki-0`.

Next, we can describe this pod using:
```
kubectl --namespace keda-monitoring describe pods/monitoring-stack-loki-0
```
Look for the `Image` value in the `Containers/loki` section. If the image is indeed an older one, we can fix the problem by making changes to the `loki` section of the `kubernetes/monitoring-stack/monitoring-values.yaml` file.
```
loki:
  enabled: true
  image:
    tag: 2.9.3
```

## Promtail is not sending logs to Loki
Let us take a look at the `promtail` section of `kubernetes/monitoring-stack/monitoring-values.yaml`.
```
promtail:
    enabled: true
    config:
      clients:
        - url: http://{{ .Release.Name }}-loki:3100/loki/api/v1/push
```

In the [default values](https://github.com/grafana/helm-charts/blob/main/charts/loki-stack/values.yaml) of the `loki-stack` Helm Chart, we can see that [promtail is configured to have a client](https://github.com/grafana/helm-charts/blob/main/charts/loki-stack/values.yaml#L25-L32) at `http://{{ .Release.Name }}:3100/loki/api/v1/push`.

However, on deploying the `loki-stack`, the Loki Service gets created at `{{ .Release.Name }}-loki`.

For example, if the Helm Chart was installed with the release name `monitoring-stack`, them the Loki Service will be available at `monitoring-stack-loki` and the `promtail` client at `http://monitoring-stack-loki:3100/loki/api/v1/push`.

This is why, the default `promtail` config has to be overridden.

The following GitHub Issues Elaborate on this problem a bit:
1) [Grafana/helm-charts#1383](https://github.com/grafana/helm-charts/issues/1383)
2) [Grafana/helm-charts#2102](https://github.com/grafana/helm-charts/issues/2102)

## Telegram Bot Connection Refused (Proxy)
When behind a Proxy, the Node Telegram Bot can get Connection Refused errors while polling the Telegram Servers.
The problem is most likely a firewall set up in your network and will require your Network Administrator to make changes to proceed.

## K6 JS Import Errors
While writing a JS application that runs in Node or a web browser, it is common to avoid the `.js` extension at the end of a file while importing it.
For example, you may import a file as follows:
```
import { addTaskAndQueryStatus } from "./common";
```

However, in K6, the above import will give an error. In K6, it is required to give the complete file path, including the file extension.
```
import { addTaskAndQueryStatus } from "./common.js";
```

## Deleting ClusterRoles and ClusterRoleBindings from Namespace
During testing you may delete a namespace and then recreate it and add some resources.
It is possible that after deleting a namespace, some `ClusterRoles` and `ClusterRoleBindings` do not get deleted.

For example:
```
kubectl delete namespace keda
kubectl --namespace keda get clusterroles,clusterrolebindings
```

In this case, the `ClusterRoles` and `ClusterRoleBindings` will have to be deleted manually.
```
kubectl --namespace delete clusterrole cluster-role-name
```

## Namespace Stuck at Terminating
While deleting a namespace, K8s runs some `finalizers` on each resource that is being deleted. `finalizers` on CRD can end up in a deadlock which can cause the namespace to be stuck in the `Terminating` state.

There are a handful of guides available online to resolve this issue. [This](https://www.youtube.com/watch?v=ebxbJcyMD-o) is adequate to solve the problem.
