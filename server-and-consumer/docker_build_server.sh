#!/bin/bash

ln -fs .dockerignore.server .dockerignore

docker build -f Dockerfile.server -t abhilakshsinghreen/key-value-store-api-server .