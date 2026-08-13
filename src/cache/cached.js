import { redis } from "../redis.js";

/**
 * cached(key, ttl, fetcher) — YOUR JOB.
 *
 * Turn this into a cache-aside helper WITH stampede protection.
 * Right now it does NO caching — it just runs the fetcher every time,
 * so the endpoints work but are slow and unprotected.
 *
 * Implement, in order:
 *   1. redis.get(key) — on a HIT, JSON.parse and return it (no DB).
 *   2. On a MISS, take a stampede lock so only ONE request does the work:
 *        const got = await redis.set("lock:" + key, "1", "NX", "EX", 5);
 *      - if got: run fetcher(), SET the key with an EX ttl, DEL the lock, return.
 *      - else (someone else holds the lock): sleep ~50ms, re-read the cache,
 *        return that (or fall back to fetcher() if still empty).
 *
 * The worked reference is the cached() helper from the lesson — study it,
 * then write your own here.
 */
export async function cached(key, ttl, fetcher) {
  // TODO: replace this naive passthrough with cache-aside + SET ... NX EX lock.
  return fetcher();
}
