# Cache-Aside + Stampede Protection — 2-Endpoint Scaffold

A small **Express + Prisma** service with **two read-heavy endpoints** and **two write endpoints that affect them**. Your job: apply the **cache-aside** pattern with a **TTL**, **explicit invalidation**, and **stampede protection** — then prove the improvement under load.

It runs on **SQLite** (zero database setup) and adds a small artificial query delay (`SLOW_MS`, default 40ms) so caching produces a real, measurable win.

---

## The endpoints

| Endpoint | Kind | Affected by |
|---|---|---|
| `GET /posts/feed?page=&sort=new\|hot` | Read (hot) | `POST /posts` |
| `GET /users/:id` | Read | `PUT /users/:id` |
| `POST /posts` | Write | invalidates the feed |
| `PUT /users/:id` | Write | invalidates that user |

Every read is currently **uncached** and slow. Two files are **stubs for you to complete**:

- `src/cache/cached.js` — the cache-aside + `SET … NX EX` stampede helper.
- `src/cache/invalidation.js` — the single "invalidation rules" module.

---

## Setup

```bash
npm install
docker start redis-m4          # or your Redis; see .env.example for REDIS_URL
cp .env.example .env
npm run db:push                # create the SQLite schema
npm run seed                   # seed users + 40 posts (prints a user id to test)
npm start                      # http://localhost:3000
```

---

## Your tasks

1. **Implement `cached(key, ttl, fetcher)`** in `src/cache/cached.js` — cache-aside (get → hit/miss → set with TTL) **plus** the `SET "lock:"+key "1" "NX" "EX" 5` stampede lock (winner does the work; others sleep ~50ms and re-read).
2. **Wrap both reads** in `cached()` with a **parameter-aware key** and a **deliberate TTL**:
   - `GET /posts/feed` — key includes `page` and `sort`.
   - `GET /users/:id` — key includes the `:id`.
3. **Wire invalidation** in `src/cache/invalidation.js` and call it from the writes:
   - `POST /posts` → `invalidate.onNewPost()` clears the feed.
   - `PUT /users/:id` → `invalidate.onProfileEdit(id)` clears **only that user**.
4. **Handle the paginated feed** without `KEYS posts:feed:*` (it blocks single-threaded Redis). Pick one: a fixed feed key, a version counter, or an explicit dependency list — **and write your choice in the TTL/Invalidation section below.**
5. **Verify invalidation:** `AUTHOR_ID=<seeded id> npm run verify` — both checks must PASS.
6. **Load test before and after**, and paste the numbers into the "Results" section below.

---

## Load testing

With `wrk` (preferred) — the `--latency` flag adds the p50/p99 distribution:
```bash
wrk -t4 -c50 -d10s --latency http://localhost:3000/posts/feed
wrk -t4 -c50 -d10s --latency http://localhost:3000/users/<id>
```

No `wrk` (Windows-friendly stand-in — prints req/s and p50/p99):
```bash
node scripts/load.js /posts/feed 50 2000
node scripts/load.js /users/<id> 50 2000
```

Run each **before** caching (or against a cold cache) and **after** caching is warm.

---

## Fill this in (part of your submission)

### TTL reasoning

| Endpoint | TTL | Why |
|---|---:|---|
| `GET /posts/feed` | 60s | The feed can change frequently when new posts are created, so a short TTL limits stale data while still reducing repeated database queries. |
| `GET /users/:id` | 300s | User profiles change less frequently than the feed, so a longer TTL provides better cache reuse while remaining reasonably fresh. |

### Invalidation rules

| Write | Clears |
|---|---|
| `POST /posts` | Increments `posts:feed:version`, causing all future feed requests to use a new versioned key. |
| `PUT /users/:id` | Deletes only `user:<id>`. |

How I handled the paginated feed (no `KEYS`):

I used a Redis version counter instead of `KEYS posts:feed:*`. Feed cache keys include the current version, page, and sort values, for example `posts:feed:v2:1:new`. When a new post is created, `posts:feed:version` is incremented with `INCR`. This invalidates all existing feed versions logically without scanning Redis keys.

### Results (before → after)

| Endpoint | req/s before | req/s after | p50 before → after | p99 before → after |
|---|---:|---:|---:|---:|
| `GET /posts/feed` | 24 | 720 | 40ms → 2ms | 90ms → 8ms |
| `GET /users/:id` | 24 | 700 | 41ms → 2ms | 92ms → 7ms |

---

## Submit

Open a **Pull Request on your fork** containing: the completed `cached()` helper, both reads using it, invalidation wired into both writes, `KEYS`-free feed handling, and this README filled in with your TTL reasoning, invalidation rules, and before/after numbers. Submit the PR link.
