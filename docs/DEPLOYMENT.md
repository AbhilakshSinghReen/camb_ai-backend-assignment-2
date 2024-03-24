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
kubectl --namespace keda get pods --watch
```

In another new terminal, run the following command to start the basic load test. The `ARCHITECTURE.md` describes the tests in more detail.
```
k6 run tests/load-tests/test_vu-5_iter-2.js
```

As the test proceeds, new pods with the prefix `api-worker` should be created. And, a few minutes after the completion of the test, all `api-worker` pods except one should have terminated.

## Monitoring Setup