# Docker Microservices — Student Project

A hands-on Docker session. You'll containerise and operate a small microservices
app: an Nginx **gateway** → a Python **tasks-service** + a Node **users-service** →
shared **PostgreSQL** + **Redis**.

## Start here
Open **`TASKS.md`** — it's a 3-hour session in three blocks:

- **Block A — Build:** `skeleton/` has the working app but blank Dockerfiles and
  `docker-compose.yml`. You write them.
- **Block B — Break-fix:** `broken/` is the same app with 4 planted bugs to find and fix.
- **Block C — Ops drills:** logs, exec, scale, kill/recover, `down` vs `down -v`.

## Reference docs (`docs/`)
- `00-architecture.md` — how the 5 containers fit together.
- `06-docker-cli-single-container.md` — commands for one image/container.
- `07-docker-compose-commands.md` — commands for the whole stack.
- `08-troubleshooting-scenarios.md` — how to diagnose failures (use in Block B).

## Layout
```
skeleton/   Block A — working app, Docker files to write
broken/     Block B — same app + 4 bugs to fix
docs/       reference material
TASKS.md    the session
```

Requires Docker Desktop with the WSL2 backend (or the Docker engine in WSL).
