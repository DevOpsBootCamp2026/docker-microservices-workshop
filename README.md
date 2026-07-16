# Docker Microservices — Student Project

A hands-on Docker session. You'll containerise and run a small microservices app:
an Nginx **gateway** → a Python **tasks-service** + a Node **users-service** →
shared **PostgreSQL** + **Redis**.

## Start here
Open **`TASKS.md`**. The app code in `skeleton/` already works — your job is to write
the Docker files (two Dockerfiles + `docker-compose.yml`) so the whole stack runs
with `docker compose up --build`, then run the ops drills.

## Reference docs (`docs/`)
- `00-architecture.md` — how the 5 containers fit together (read first).
- `06-docker-cli-single-container.md` — commands for one image/container.
- `07-docker-compose-commands.md` — commands for the whole stack.
- `08-troubleshooting-scenarios.md` — how to diagnose failures while building.

## Layout
```
skeleton/   working app + blank Dockerfiles/compose for you to write
docs/       reference material
TASKS.md    the session
```

Requires Docker Desktop with the WSL2 backend (or the Docker engine in WSL).
