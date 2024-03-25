In this document, we discuss the system architecture, the high-level design decesions, as well as how to code is structured and how to test the system.

When deployed to a K8s Cluster, the system will look something like the following:
![System Architecture Image](./images/Architecture.jpg)

# High-Level Design
The system has 2 Main components:
1) Application (running in the `keda` namespace)
2) Monitoring (running in the `keda-monitoring namespace`)

## The Application
The application itself can be devided into 3 components:
1) The API Server
2) The Huey Worker
3) The Redis DB

### API Server
The API Server is the simplest of the three components: a Fast API Server that produces tasks, running in a Horizontal Pod AutoScaler.
The server has separate ports for handing the API endpoints (8000) and exposing its Prometheus metrics (9001).

### Huey Worker
The Huey Worker, or Consumer, is the application that consumes the tasks produced by the API Server. This application is scaled using `KEDA`, based on the number of tasks queued in `Redis`.

### Redis
Now, let's look at the more complicated part of the application: deploying Redis.
Redis is an in-memory DB, but we would like to persist data on the disk so we don't lose data when a redis Pod is reschedules.

For deploying Redis, I have used the Helm charts provided by Bitnami (`https://charts.bitnami.com/bitnami`) with some custom configuration.

#### High Availability vs Clustering
I have chosen to run Redis in the "High Availability" mode using Redis Sentinels.

Redis Clustering would involve storing keys on different Redis nodes by sharding. However, this comes with read/write limitation. Since, I do not have any particular information about that kind of data that will be stored in the key-value store, I have gone with a High Availability setup.

#### Pod Anti-affinity
In a Cloud Deployment Environment, I would like to make sure that the Redis Sentinels don't run on the same node as the Redis Master they are tracking, as, in this case, the failure of that node will destroy the High Availability System.

We can customize our deployments to specify `podAntiAffinity` relative to other pods using labels.

But, since I am using Minikube, I only have one node to schedule all the pods on. :(

### External Traffic
The API Server is connected to a `LoadBalancer` service through which the APIs can be accessed from outside the Cluster. For the puporse of this demo, we will give this service an external IP using the `minikube tunnel` command. For deployment in the Cloud, I would proceed with K8s `Ingress`.

### Metrics Service
We do not want the Metrics of the API Server to be exposed outside the Cluster, since they are only to be picked up by `Prometheus`, which in our setup is running inside the Cluster. Therefore, we have another service, of the type `ClusterIP`, that targets the port 9001 on the API Server pod. The sole purpose of this service is to expose the server's metrics.

## The Monitoring Stack
The monitoring stack involves the following components:
1) Prometheus (with AlertManager)
2) Loki
3) Promtail
4) Grafana
5) Webhook
The first 4 components are part of the `loki-stack` Helm Chart.

## Loki Stack (Loki, Promtail, Prometheus, Grafana)

## Webhook
In order to send us messages on Telegram when certain alerts are fired in Prometheus, I have set up a simple webhook that can be called by the `Prometheus Alert Manager` when it receives an alert from `Prometheus`.

# Low-Level Design

# Testing