# Docker Microservices — Student Session

You will containerise and run a small microservices app: an Nginx **gateway** in
front of a Python **tasks-service** and a Node **users-service**, sharing
**PostgreSQL** and **Redis** — five containers, two networks. The app code already
works; **you write the Docker files** to make it run.

**Requirements:** Docker Desktop with the WSL2 backend (or Docker engine in WSL).
Check: `docker --version` and `docker compose version`.

**Reference while you work:** `docs/00-architecture.md` (the big picture),
`docs/06` and `docs/07` (command references), `docs/08` (troubleshooting).

---

## Block 0 — Setup (10 min)
1. Clone this repo and `cd` into it.
2. Skim `docs/00-architecture.md` to see how the 5 containers connect.
3. Confirm Docker works: `docker run --rm hello-world`.

---

## Block A — Build the container recipes (main task)
Folder: `skeleton/`. The **app code works**; the Docker files are TODO stubs. Write
them so `docker compose up --build` brings up all five services.

**Discover the facts from the code (don't guess):**
- `skeleton/gateway/nginx.conf` → the service **names and ports** the gateway proxies to.
- `skeleton/tasks-service/app.py` → the port Flask listens on and the `DB_*`/`REDIS_HOST` env it reads.
- `skeleton/users-service/server.js` → the port Express listens on and its env.

**Tasks**
1. `gateway/Dockerfile` — Nginx image that loads `nginx.conf` and serves the 3 static files.
2. `tasks-service/Dockerfile` — Python image; order steps for layer caching (deps before code).
3. `users-service/Dockerfile` — Node image; same caching order.
4. `docker-compose.yml` — five services + two networks:
   - `gateway`: build, publish `8080:80`, `frontend-net` only.
   - `tasks-service` / `users-service`: build, env vars, **both** networks, start after db healthy.
   - `db`: postgres image, `POSTGRES_*` env, named volume, healthcheck, `backend-net` only.
   - `redis`: redis image, named volume, `backend-net` only.
5. Create `.env` with the `POSTGRES_*` values your compose references.

**Definition of done**
- [ ] `docker compose up --build` starts all 5 services; `db` is healthy.
- [ ] http://localhost:8080 loads **styled**; both panels list and accept entries.
- [ ] A second read shows `"source": "cache"` (Redis working).
- [ ] Prove isolation: `docker compose exec gateway sh -c "ping -c1 db"` **fails**
      (gateway is not on `backend-net`), while the same ping from `tasks-service` succeeds.

**Stretch:** add a `healthcheck` to `tasks-service` hitting `/api/tasks/health`.

---

## Block B — Ops drills (once your stack is up)
Run each on your working stack and note what you observe.

1. **Logs:** `docker compose logs -f users-service` — add a user, watch it.
2. **Shell in:** `docker compose exec db psql -U app -d appdb -c "SELECT * FROM tasks;"`
3. **Cache peek:** `docker compose exec redis redis-cli KEYS '*'` then `GET tasks:all`.
4. **Resilience:** `docker compose kill tasks-service` → refresh (users still work!) →
   `docker compose ps` → `docker compose logs tasks-service` → `docker compose up -d tasks-service`.
5. **Scale:** `docker compose up -d --scale tasks-service=3` → `docker compose ps`. Scale back to 1.
6. **Config render:** `docker compose config` — see how `${POSTGRES_*}` resolved.
7. **Teardown:** `docker compose down` (data survives) vs `docker compose down -v` (data wiped).

---

## Wrap-up
Be ready to answer:
- Why can the gateway reach the services but not the database?
- What does `EXPOSE` do — and not do?
- Why copy the dependency file before the source in a Dockerfile?
- What does a `502` from the gateway usually mean?
