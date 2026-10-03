import { Router } from "express";
import { prisma, slowQuery } from "../db.js";
import { redis } from "../redis.js";
import { cached } from "../cache/cached.js";
import { invalidate } from "../cache/invalidation.js";

const router = Router();

const FEED_VERSION_KEY = "posts:feed:version";

// READ: GET /posts/feed?page=1&sort=new|hot
router.get("/posts/feed", async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const sort = req.query.sort === "hot" ? "hot" : "new";

  // Get current feed version
  let version = await redis.get(FEED_VERSION_KEY);

  if (!version) {
    version = "1";
    await redis.set(FEED_VERSION_KEY, version);
  }

  // Version + page + sort = parameter-aware key
  const key = `posts:feed:v${version}:${page}:${sort}`;

  const feed = await cached(key, 60, async () => {
    await slowQuery();

    return prisma.post.findMany({
      orderBy:
        sort === "hot"
          ? { likes: "desc" }
          : { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
      include: { author: true },
    });
  });

  res.json(feed);
});

// WRITE: POST /posts
router.post("/posts", async (req, res) => {
  const post = await prisma.post.create({
    data: req.body,
  });

  await invalidate.onNewPost();

  res.status(201).json(post);
});

export default router;