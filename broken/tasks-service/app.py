# =============================================================================
# tasks-service  -  a Python/Flask microservice.
# Owns ONE job: managing tasks. It talks to a shared PostgreSQL and caches
# reads in Redis. It never talks to the users-service directly - the gateway
# is the only public door, and each service minds its own data.
# All addresses and secrets arrive as ENVIRONMENT VARIABLES (set by Compose).
# =============================================================================
import os
import time
import json
from flask import Flask, jsonify, request
import psycopg2
import psycopg2.extras
import redis

app = Flask(__name__)

DB = dict(
    host=os.environ.get("DB_HOST", "db"),
    dbname=os.environ.get("DB_NAME", "appdb"),
    user=os.environ.get("DB_USER", "app"),
    password=os.environ.get("DB_PASSWORD", "app"),
)
CACHE = redis.Redis(
    host=os.environ.get("REDIS_HOST", "redis"),
    port=int(os.environ.get("REDIS_PORT", 6379)),
    decode_responses=True,
)
CACHE_KEY = "tasks:all"


def db_conn():
    return psycopg2.connect(**DB)


def init_db(retries=15):
    """Create our table if missing. Retry, because the DB may still be booting."""
    for attempt in range(1, retries + 1):
        try:
            conn = db_conn()
            cur = conn.cursor()
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS tasks (
                    id          SERIAL PRIMARY KEY,
                    title       TEXT NOT NULL,
                    done        BOOLEAN DEFAULT FALSE,
                    created_at  TIMESTAMPTZ DEFAULT now()
                );
                """
            )
            conn.commit()
            cur.close()
            conn.close()
            print("[tasks] schema ready", flush=True)
            return
        except Exception as exc:
            print(f"[tasks] db not ready ({attempt}/{retries}): {exc}", flush=True)
            time.sleep(2)
    raise RuntimeError("tasks-service could not reach the database")


@app.get("/api/tasks/health")
def health():
    return jsonify(status="ok", service="tasks-service")


@app.get("/api/tasks")
def list_tasks():
    cached = CACHE.get(CACHE_KEY)
    if cached:
        return jsonify(source="cache", tasks=json.loads(cached))

    conn = db_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM tasks ORDER BY id DESC")
    tasks = [dict(row) for row in cur.fetchall()]
    cur.close()
    conn.close()
    for t in tasks:
        t["created_at"] = str(t["created_at"])

    CACHE.setex(CACHE_KEY, 30, json.dumps(tasks))  # cache for 30s
    return jsonify(source="database", tasks=tasks)


@app.post("/api/tasks")
def create_task():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify(error="title is required"), 400

    conn = db_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("INSERT INTO tasks (title) VALUES (%s) RETURNING *", (title,))
    task = dict(cur.fetchone())
    task["created_at"] = str(task["created_at"])
    conn.commit()
    cur.close()
    conn.close()

    CACHE.delete(CACHE_KEY)  # invalidate the cache after a write
    return jsonify(task=task), 201


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000)
