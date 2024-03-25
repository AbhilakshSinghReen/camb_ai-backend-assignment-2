# Deploy on Kubernetes
## Prerequisites
To proceed with the deployment, the following prerequisites are required:
1) A `Kubernetes` Cluster - for this guide, I will be using [minikube](https://minikube.sigs.k8s.io/docs/start/).
2) [Kubectl](https://kubernetes.io/docs/tasks/tools/)
3) [Helm](https://helm.sh/docs/intro/install/)
4) [K6](https://k6.io/docs/get-started/installation/) - `K6` is a tool by Grafana Labs that we will be using for load testing.

It is also recommended to have `KEDA` enabled on your K8s cluster. However, if you're following along using `minikube`, we will be installing KEDA as we proceed.

## Get the Code
Clone this repository <br>
```
git clone https://github.com/AbhilakshSinghReen/camb_ai-backend-assignment-2.git
```

Move into the project folder
```
cd camb_ai-backend-assignment-2
```

## Deployment
### Setup K8s namespace
To manage the resources of our project, we'll be creating a K8s namespace called `keda`.
```
kubectl create namespace keda
```


### Setup KEDA
(You don't need to do this if you already have KEDA on your K8s Cluster.)
```
kubectl apply --filename https://github.com/kedacore/keda/releases/download/v2.10.1/keda-2.10.1-core.yaml
```

### Setup Redis
For running Redis, in our cluster, we'll be using the Helm chart provided by Bitnami.

Add the Bitnami repo to Helm.
```
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

Create the ConfigMap for Redis.
```
kubectl --namespace keda apply --filename kubernetes/redis/redis-configmap.yaml
```

Install the help chart. The installation uses values defined in `kubernetes/redis/redis-values.yaml`
```
helm upgrade --install --namespace keda keda-redis bitnami/redis --values kubernetes/redis/redis-values.yaml --set auth.enabled=false
```

### Setup Worker
In order to setup the Huey Worker, we have to create 2 resources.

First, the worker deployment:
```
kubectl --namespace keda apply --filename kubernetes/worker/worker.yaml
```

And, then we create the KEDA ScaledObject for the worker.
```
kubectl --namespace keda apply --filename kubernetes/worker/worker-keda-scaledobject.yaml
```

### Setup Server
Setting up the API Server involves creating 5 resources.

First, we create the Server ConfigMap.
```
kubectl --namespace keda apply --filename kubernetes/server/server-configmap.yaml
```

Next, we create the Server Deployment, the Service, and the Metrics Service. All 3 of these are defined in the `kubernetes/server/server.yaml`.
```
kubectl --namespace keda apply --filename kubernetes/server/server.yaml
```

And finally, we create a LoadBalancer Service for the server so that we can access it from outside our Cluster.
```
kubectl --namespace keda apply --filename kubernetes/server/server-loadbalancer-service.yaml
```

The API Server exposes `Prometheus` metrics on a different port than the API (9001 as specified in the ConfigMap). This is described in more detail in the `ARCHITECTURE.md`.
Let us port forward and see if the metrics are being exposed.

Run the following command to map port 9001 of your local machine to port 9001 of the metrics service.
```
kubectl --namespace keda port-forward service/api-server-metrics 9001:9001
```

Then, head to `http://localhost:9001/metrics` in your browser. You should see some Prometheus metrics being displayed.

### Testing KEDA
Before we setup our monitoring tools, let us quickly check if the Event-Driven Autoscaling works as intended.

First, we expose our API Load Balancer service outside the cluster, using:
```
minikube tunnel
```

In order to load test the application and validate KEDA, we'll be using some tests defined in `tests/load-tests`. For running these tests, we will be using `K6` (a load testing tool by Grafana Labs.).

In a new terminal, run the following command to observe the pods created/destroyed.
```
watch -n 1 kubectl --namespace keda get pods
```

In another new terminal, run the following command to start the basic load test. The `ARCHITECTURE.md` describes the tests in more detail.
```
k6 run tests/load-tests/test_vu-5_iter-2.js
```

As the test proceeds, new pods with the prefix `api-worker` should be created. And, a few minutes after the completion of the test, all `api-worker` pods except one should have terminated.

## Monitoring Setup
### Create Monitoring K8s namespace
To keep things organized, we put all the monitoring-related resources in a separate K8s namespace called `keda-monitoring`.
```
kubectl create namespace keda-monitoring
```

Install the Loki-Stack (with Prometheus)
```
helm --namespace keda-monitoring upgrade --install monitoring-stack grafana/loki-stack --values kubernetes/monitoring-stack/monitoring-values.yaml
```

Create the LoadBalancer Service for Grafana
```
kubectl --namespace keda-monitoring apply --filename kubernetes/monitoring-stack/grafana-loadbalancer-service.yaml
```


Get Grafana Password
```
kubectl --namespace keda-monitoring get secret monitoring-stack-grafana --output jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

Port forward Prometheus
```
kubectl -n keda-monitoring port-forward service/monitoring-stack-prometheus-server 9090:80
```

Check Promethus configuration:
1) Head to `http://localhost:9090/targets` and see if the `long_task_api_server` target has been registered.
2) Head to `http://localhost:9090/alerts` and see if the `worker_max_replicas_reached` alert has been registered.

### Load Testing KEDA and Prometheus Alert Trigger
For running the test, you should have `minikube tunnel` running in a terminal.
In order to access Prometheus in the Browser, you should Port Forward to the Prometheus Server service.
```
kubectl -n keda-monitoring port-forward service/monitoring-stack-prometheus-server 9090:80
```

In a new terminal, run the following command to observe the pods created/destroyed.
```
watch -n 1 kubectl --namespace keda get pods
```

And, in one more terminal, navigate to the project directory and run the following command to perform a load test:
```
k6 run tests/load-tests/test_vu-20_iter-20.js
```

Once the tests have started, you should see 5 worker pods created in the keda namespace.

Head to `http://localhost:9090/alerts`, after a couple of minutes, the `worker_max_replicas_reached` alert should move into the `Pending` state.
After another 30 seconds, the alert should be in the `Firing` state.

<!-- Visualing this alert in Grafana -->

As the test completes, after a few minutes, the workers should scale down and the alert should go back into the `Inactive` state.
