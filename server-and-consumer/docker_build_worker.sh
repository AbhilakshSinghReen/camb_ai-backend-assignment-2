#!/bin/bash

ln -fs .dockerignore.worker .dockerignore

docker build -f Dockerfile.worker -t abhilakshsinghreen/key-value-store-api-worker .