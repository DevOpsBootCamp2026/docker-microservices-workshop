# 07 — Docker Compose commands (the whole stack)

Compose runs the same build/run/logs/exec commands from doc 06, but across **all
five services at once**, and it adds the network + volumes + start order. Run these
from `demo/` (the folder with `docker-compose.yml`).

> First time only: `cp .env.example .env`

## Bring the stack up / down
```bash
docker compose up --build          # build images + create network/volumes + start all
docker compose up --build -d       # same, detached (background)
docker compose up -d               # start without rebuilding (faster if nothing changed)
docker compose down                # stop + remove containers and the network (volumes KEPT)
docker compose down -v             # also delete named volumes (fresh, empty data)
docker compose stop                # stop containers but keep them (start again later)
docker compose start               # start previously stopped containers
```

## See what's running
```bash
docker compose ps                  # status of the five services
docker compose ps -a               # include stopped ones
docker compose top                 # processes inside each service
```

## Logs (per service or all)
```bash
docker compose logs -f             # follow logs from ALL services, interleaved
docker compose logs -f tasks-service     # just one service
docker compose logs --tail 50 gateway    # last 50 lines of the gateway
```

## Run commands inside a service
```bash
docker compose exec tasks-service sh              # shell into the tasks container
docker compose exec db psql -U app -d appdb       # open psql in the database
docker compose exec redis redis-cli               # open the Redis CLI
docker compose exec users-service env             # print its env vars
```
`compose exec` targets by **service name**, not container name — nicer than raw
`docker exec`.

## Build / rebuild
```bash
docker compose build                    # build all images
docker compose build tasks-service      # build just one
docker compose up --build               # build changed images, then (re)start
docker compose up -d --no-deps --build tasks-service   # rebuild+restart ONE service only
```

## Scale a service (run N copies)
```bash
docker compose up -d --scale tasks-service=3
```
Runs three `tasks-service` containers behind the same network name. (Works here
because the service has no fixed host port; the gateway load-balances via DNS.)

## Config, validation, inspection
```bash
docker compose config          # render the final resolved config (great for debugging ${VARS})
docker compose config --services   # list service names
docker compose images          # images used by each service
docker compose events          # live stream of container events
```

## Restart policy in action
Every service has `restart: unless-stopped`. Try:
```bash
docker compose kill tasks-service      # simulate a crash
docker compose ps                      # watch Docker restart it automatically
```

## Cheat card
```
up      → docker compose up --build [-d]
down    → docker compose down [-v]
status  → docker compose ps
logs    → docker compose logs -f [service]
shell   → docker compose exec <service> sh
rebuild1→ docker compose up -d --no-deps --build <service>
scale   → docker compose up -d --scale <service>=N
verify  → docker compose config
```
