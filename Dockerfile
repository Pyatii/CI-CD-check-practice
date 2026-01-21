# Используем этот Dockerfile для быстрого запуска всего стека
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

CMD ["docker-compose", "up", "--build"]
