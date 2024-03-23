#!/bin/bash

ln -fs .dockerignore.worker .dockerignore

docker build -f Dockerfile.worker -t abhilakshsinghreen/long-task-api-worker .