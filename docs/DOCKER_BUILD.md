In this doc, we will see how to make changes to the source code of the following components:
1) The API Server
2) The Huey Worker
3) The Prometheus Alert Manager Webhook
and how to build your Docker images for the above components and push them to Docker Hub in order to deploy them in your K8s Cluster.

For an explanation of how the code is structured for each of the components, please have a look at the [ARCHITECTURE.md](./ARCHITECTURE.md).

## API Server
The `server-and-worker` directory contains the code of the API server component, that is powered by FAST API.

In order to build a Docker image of the API Server, we can use the `docker_build_server.sh` script available in the same directory.

But, let's take a look at a couple of things in the script first.

```
#!/bin/bash

ln -fs .dockerignore.server .dockerignore

docker build -f Dockerfile.server -t abhilakshsinghreen/key-value-store-api-server .
```

The first statement, links `.dockerignore.server` to `.dockerignore`. This is required as `docker build` does not have support for passing in a custom dockerignore file. In [ARCHITECTURE.md](./ARCHITECTURE.md), we discuss why the server and worker code is not put into separate directories.

The second statement, build the Docker image using `Dockerfile.server` as the input DockerFile. By default, the image is tagged `abhilakshsinghreen/key-value-store-api-server`. In order to upload this image to your own Docker Registry, please change the tag accordingly.


## Huey Worker
Quite similar to the API Server, the Huey Worker Docker image can be built using `docker_build_worker.sh`. It also links `.dockerignore.worker` to `.dockerignore` and tags the image.

## Prometheus Alert Manager Webhook
The source code for this component is contained in the `webhooks/alerter-bot` directory.
In order to build the Docker image, we can simply run the `docker_build.sh` script, available in the same directory.


## Deploying YOUR containers on K8s
Once you've built and pushed the API Server and Huey worker images to your Docker Registry, we can deploy them in a K8s Cluster.

Let's assume, we have the images `exampleperson/long-task-api-server`, `exampleperson/long-task-api-worker`, and `exampleperson/prom-alertmanager-webhooks`.

We need to make three updates (each corresponding to a deployment) to use the custom images.
1) In `kubernetes/worker/server.yaml` at line 19, we will specify the API Server image.
2) In `kubernetes/worker/worker.yaml` at line 19, we will specify the new API Worker image.
3) In `kubernetes/monitoring-stack/prom-alert-manager-webhooks.yaml` at line 19, we have to specify the updated Webhooks image.

With these changes made, we can follow the steps in [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy on K8s.
