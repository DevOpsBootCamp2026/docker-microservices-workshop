# 06 — Docker commands for ONE image / ONE container

Before `docker compose` does it all for you, you must know the raw commands it runs
under the hood. Everything here works on a **single** Dockerfile/image/container.
Examples use the `tasks-service`, but the commands are identical for any image.

> Run these from `demo/`. Anywhere you see `<container>` you can use the container's
> name or the first few characters of its ID (from `docker ps`).

## 1. Build an image from a Dockerfile
```bash
docker build -t tasks-service ./tasks-service
```
- `-t tasks-service` — **tag** (name) the image.
- `./tasks-service` — the **build context**: the folder sent to the engine; its
  `Dockerfile` is read and `.dockerignore` filters it.

Useful variants:
```bash
docker build -t tasks-service:v1 ./tasks-service      # explicit version tag
docker build --no-cache -t tasks-service ./tasks-service   # ignore layer cache
docker build -f ./tasks-service/Dockerfile ./tasks-service # custom Dockerfile path
```

## 2. See your images
```bash
docker images                 # list images + sizes
docker history tasks-service  # the layers that make up the image
```

## 3. Run a container from the image
```bash
docker run --rm -p 5000:5000 \
  -e DB_HOST=host.docker.internal -e REDIS_HOST=host.docker.internal \
  --name tasks tasks-service
```
- `--rm` — delete the container when it exits (no leftovers).
- `-p 5000:5000` — publish `HOST:CONTAINER`. **This** is what opens the port;
  `EXPOSE` alone does not.
- `-e KEY=value` — set an environment variable.
- `--name tasks` — give the container a friendly name.
- `-d` — (add it) run **detached**, in the background.

> A single service run alone needs its db/redis somewhere — which is exactly the
> pain Compose removes. Shown here to prove what Compose automates.

## 4. List containers
```bash
docker ps          # running containers
docker ps -a       # include stopped/exited ones
```

## 5. See logs (your #1 debugging tool)
```bash
docker logs tasks              # all logs so far
docker logs -f tasks           # follow (live tail) — Ctrl-C to stop
docker logs --tail 50 tasks    # last 50 lines
docker logs -t tasks           # with timestamps
```

## 6. Look inside a running container
```bash
docker exec -it tasks sh                 # open a shell inside the container
docker exec tasks env                    # print its environment variables
docker exec tasks ls -la /app            # run any one-off command
```
`-it` = interactive + TTY, needed for a shell. Alpine images have `sh`, not `bash`.

## 7. Inspect / stats (metadata and live resource use)
```bash
docker inspect tasks           # full JSON: mounts, networks, env, IP, etc.
docker inspect -f '{{.State.Health.Status}}' tasks   # one field only
docker stats                   # live CPU/memory per container (q to quit)
docker port tasks              # which ports are published
```

## 8. Stop, start, remove
```bash
docker stop tasks              # graceful stop (SIGTERM, then SIGKILL)
docker start tasks             # start a stopped container
docker restart tasks           # stop + start
docker rm tasks                # remove a STOPPED container
docker rm -f tasks             # force-remove a running one
docker rmi tasks-service       # remove the image
```

## 9. Clean up disk
```bash
docker system df               # how much space images/containers/volumes use
docker container prune         # remove all stopped containers
docker image prune             # remove dangling images
docker system prune -a         # remove everything unused (careful!)
```

## Cheat card
```
build → docker build -t name ./dir
run   → docker run --rm -p H:C -e K=V --name n name   (add -d for background)
list  → docker ps [-a]
logs  → docker logs -f n
shell → docker exec -it n sh
stop  → docker stop n     remove → docker rm n     image → docker rmi name
```
