# 08 — Troubleshooting scenarios: when it's down, how to diagnose

Containers fail. The skill is not "never break things" — it's **reading the system
to find out why**. This doc gives a repeatable method, then eight concrete
scenarios written as *Symptom → Diagnose → Cause → Fix*. Use it whenever your stack
misbehaves while you build it.

---

## The universal diagnosis ladder (memorise this order)

Always climb these rungs in order — cheapest, most-informative first:

```
1. docker compose ps          →  what's up, what's restarting, what exited?
2. docker compose logs <svc>  →  what did the failing service SAY as it died?
3. docker compose exec <svc> sh   →  get inside; test its view of the world
4. curl / ping from inside    →  can this service actually reach its dependency?
5. docker inspect <svc>       →  env vars, networks, mounts, health status
```

90% of problems are solved at rung 1 or 2. Teach students to **read the logs before
guessing**.

---

## Scenario 1 — `http://localhost:8080` won't load at all
**Symptom:** browser spins, "connection refused."
**Diagnose:**
```bash
docker compose ps        # is 'gateway' actually Up? is 8080 mapped?
```
**Likely causes & fixes:**
- Gateway isn't running → look at `docker compose logs gateway`.
- Nothing is running → you forgot `docker compose up`, or it errored on build.
- Wrong port → the mapping is `8080:80`; you opened `:80` or `:3000`. Use **8080**.

## Scenario 2 — "port is already allocated" on `up`
**Symptom:** `Error: ... Bind for 0.0.0.0:8080 failed: port is already allocated`.
**Diagnose:**
```bash
docker ps                       # another container already using 8080?
```
**Cause:** something else (an old stack, another app) owns host port 8080.
**Fix:** stop the other user, or change the gateway mapping to e.g. `"8090:80"` and
open `:8090`.

## Scenario 3 — a service is in a restart loop
**Symptom:** `docker compose ps` shows `tasks-service` as `Restarting` over and over.
**Diagnose:**
```bash
docker compose logs --tail 30 tasks-service
```
Read the last error before each restart. Because `restart: unless-stopped` is set,
a crashing service keeps bouncing — the logs repeat the same fatal line.
**Common causes:** a Python/Node exception on startup, a missing env var, or it gave
up waiting for the database (see Scenario 4).
**Fix:** address the specific error; then `docker compose up -d --build tasks-service`.

## Scenario 4 — service can't reach the database
**Symptom:** logs show `could not connect to server` / `db not ready (15/15)` then exit.
**Diagnose:**
```bash
docker compose logs tasks-service          # confirm it's a DB connection error
docker compose ps db                       # is db Up and healthy?
docker compose exec tasks-service sh
#   inside the container:
#   nc -z db 5432   (or)   ping db
```
**Likely causes & fixes:**
- **Wrong host:** the service must use `DB_HOST=db` (the service name), not
  `localhost`. Inside a container, `localhost` is the container itself.
- **Wrong network:** the service must be on `backend-net`. If someone removed it
  from that network, it literally cannot see `db`. Re-add it in compose.
- **DB still booting:** normally handled by `condition: service_healthy` + the retry
  loop. If the healthcheck is misconfigured the gate opens too early.
- **Bad credentials:** `DB_USER`/`DB_PASSWORD` don't match the `POSTGRES_*` values.
  Check `docker compose exec tasks-service env` vs the `db` service's env.

## Scenario 5 — `502 Bad Gateway` when calling /api/...
**Symptom:** the page loads, but `/api/tasks` returns **502** from Nginx.
**Diagnose:**
```bash
docker compose logs gateway           # nginx logs the upstream it failed to reach
docker compose ps tasks-service       # is the upstream even up?
docker compose exec gateway sh -c "wget -qO- http://tasks-service:5000/api/tasks/health"
```
**Cause:** Nginx can reach the port but the upstream service is down, crashing, or on
the wrong port. 502 = "I'm the gateway, my upstream didn't answer."
**Fix:** get the upstream healthy (Scenario 3/4). Verify `proxy_pass` port matches
the service's `EXPOSE`/listen port (`tasks-service:5000`, `users-service:3000`).

## Scenario 6 — code change doesn't show up
**Symptom:** you edited `app.py` / `server.js`, but the app behaves the same.
**Cause:** you restarted without rebuilding, so the old image (old code) is still used.
**Fix:**
```bash
docker compose up -d --build tasks-service      # rebuild that one service
# or the whole stack:
docker compose up --build
```

## Scenario 7 — data vanished / data won't reset
**Symptom A:** "my tasks are gone after I ran `down`."
- If you ran `docker compose down -v`, the `-v` deleted the `db_data` volume. Plain
  `down` keeps it. Teach the difference.
**Symptom B:** "I want a clean database but old rows keep coming back."
- The volume persists between runs. To wipe: `docker compose down -v` then `up`.
**Diagnose:** `docker volume ls` shows the named volumes that survive.

## Scenario 8 — stale data / cache confusion
**Symptom:** you added a task via the API but `/api/tasks` still shows the old list.
**Cause:** the read was served from the **Redis cache** (30s TTL). Writes invalidate
the cache, but a direct DB change (via `psql`) bypasses the app and leaves the cache
stale.
**Diagnose:**
```bash
docker compose exec redis redis-cli KEYS '*'      # see cached keys
docker compose exec redis redis-cli GET tasks:all
docker compose exec redis redis-cli DEL tasks:all # force a fresh DB read
```
The JSON response's `"source"` field ("cache" vs "database") tells you which path
served the data — a built-in teaching signal.

---

## Live-demo script (5 minutes, high impact)
1. `docker compose up -d` then open the app — works.
2. `docker compose kill tasks-service` → refresh → tasks panel errors, users still fine.
   *"One service down doesn't take the whole system down — that's the point of
   microservices."*
3. `docker compose ps` (see it restarting) → `docker compose logs tasks-service`.
4. `docker compose up -d tasks-service` → refresh → recovered.
5. Show `"source": "cache"` vs `"database"` in the response to explain Redis.
