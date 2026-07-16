# 00 — The architecture (read this first)

This lesson upgrades the simple 3-tier app into a small **microservices** system.
Instead of one backend, we now have **two independent services** in **two
different languages**, sitting behind a single **API gateway**.

```
                         ┌───────────────────────────── frontend-net ─────────────────────────────┐
                         │                                                                          │
   Browser ─▶ :8080 ─▶ gateway (Nginx)                                                              │
                         │   ├─ /            → static frontend (baked into gateway)                 │
                         │   ├─ /api/users   → users-service (Node/Express, :3000) ┐                │
                         │   └─ /api/tasks   → tasks-service (Python/Flask, :5000) ┤                │
                         └──────────────────────────────────────────────────────── │ ──────────────┘
                                                                                    │
                         ┌───────────────── backend-net ─────────────────┐         │
                         │   db (PostgreSQL, :5432)   redis (:6379)       │◀────────┘
                         └────────────────────────────────────────────────┘
```

## The five containers

| Service | Language / image | Job | Networks |
|---------|------------------|-----|----------|
| `gateway` | Nginx | one public door: serve UI + route `/api/*` | frontend-net |
| `users-service` | Node/Express | manage users | frontend-net + backend-net |
| `tasks-service` | Python/Flask | manage tasks | frontend-net + backend-net |
| `db` | postgres:16 | shared storage | backend-net only |
| `redis` | redis:7 | shared cache | backend-net only |

## The four ideas this demonstrates

1. **API gateway.** Only the gateway has a published port. Everything else is
   private. The browser always calls `/api/...` and never knows a service moved,
   restarted, or got a new address.
2. **Polyglot services.** One service is Node, one is Python. To Docker they are
   identical — *a container is a container*. This is why teams can pick the right
   tool per service.
3. **Service discovery by name.** Services find each other by their Compose
   **service name** (`db`, `redis`, `tasks-service`) via Docker's internal DNS.
   No hard-coded IPs, anywhere.
4. **Network segmentation.** Two bridge networks. The `gateway` is only on
   `frontend-net`, so it physically **cannot** reach `db`. Attackers who break the
   gateway still can't touch the database directly.

## Shared vs per-service database (be honest with students)

Real microservices usually give **each service its own database** so services stay
truly independent. Here both services share one PostgreSQL (different tables) to
keep the container count at five and the lesson focused on Docker, not on data
architecture. Call this out in class as a deliberate simplification.

Read the files in this order: `01` gateway Dockerfile → `02` gateway nginx.conf →
`03` tasks-service Dockerfile → `04` users-service Dockerfile → `05` compose.
Then the command references (`06`, `07`) and the troubleshooting scenarios (`08`).
