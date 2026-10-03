
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
import { redis } from "../redis.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function cached(key, ttl, fetcher) {
  // 1. Check cache first
  const cachedValue = await redis.get(key);

  if (cachedValue) {
    return JSON.parse(cachedValue);
  }

  // 2. Try to acquire stampede lock
  const lockKey = "lock:" + key;

  const gotLock = await redis.set(
    lockKey,
    "1",
    "NX",
    "EX",
    5
  );

  // 3. We got the lock, so we are the request
  // responsible for fetching from the database.
  if (gotLock) {
    try {
      const value = await fetcher();

      // Store result in Redis with TTL
      await redis.set(
        key,
        JSON.stringify(value),
        "EX",
        ttl
      );

      return value;
    } finally {
      // Always release the lock
      await redis.del(lockKey);
    }
  }

  // 4. Another request is already fetching.
  // Wait briefly and check Redis again.
  await sleep(50);

  const valueAfterWait = await redis.get(key);

  if (valueAfterWait) {
    return JSON.parse(valueAfterWait);
  }

  // 5. Fallback if the other request hasn't finished yet
  return fetcher();
}