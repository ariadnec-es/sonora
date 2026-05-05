#!/bin/bash/

docker run -p 8000:8000 \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=root \
  -e DB_PASSWORD=senha \
  -e DB_NAME=sonoraDB \
  sonora-api
