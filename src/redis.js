import Redis from "ioredis";

// Uses REDIS_URL from your environment (see .env.example),
// falling back to a local Redis on the default port.
export const redis = new Redis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");

redis.on("error", (e) => console.error("[redis] error:", e.message));
