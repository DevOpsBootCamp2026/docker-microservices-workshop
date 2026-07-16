// =============================================================================
// users-service  -  a Node/Express microservice.
// Owns ONE job: managing users. Shares the PostgreSQL instance with the
// tasks-service (different table) and caches reads in Redis. Different language,
// same platform: to Docker, "a container is a container" - that is the polyglot
// lesson. Config comes only from ENVIRONMENT VARIABLES.
// =============================================================================
const express = require("express");
const { Pool } = require("pg");
const Redis = require("ioredis");

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "app",
  password: process.env.DB_PASSWORD || "app",
  database: process.env.DB_NAME || "appdb",
});

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
});
const CACHE_KEY = "users:all";
const PORT = process.env.PORT || 3000;

async function initDb(retries = 15) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id         SERIAL PRIMARY KEY,
          name       TEXT NOT NULL,
          email      TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);
      console.log("[users] schema ready");
      return;
    } catch (err) {
      console.log(`[users] db not ready (${attempt}/${retries}): ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("users-service could not reach the database");
}

app.get("/api/users/health", (_req, res) =>
  res.json({ status: "ok", service: "users-service" })
);

app.get("/api/users", async (_req, res) => {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) return res.json({ source: "cache", users: JSON.parse(cached) });

    const { rows } = await pool.query("SELECT * FROM users ORDER BY id DESC");
    await redis.set(CACHE_KEY, JSON.stringify(rows), "EX", 30); // cache 30s
    res.json({ source: "database", users: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  const name = (req.body?.name || "").trim();
  const email = (req.body?.email || "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    await redis.del(CACHE_KEY); // invalidate cache after a write
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDb()
  .then(() =>
    app.listen(PORT, () => console.log(`[users] listening on ${PORT}`))
  )
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
