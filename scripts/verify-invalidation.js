// Proves your invalidation works: create a post, fetch the feed (must show it),
// create another, fetch again (must show THAT one, not a cached older version).
// Run the server first (npm start), then: npm run verify
const API = process.env.API ?? "http://localhost:3000";

async function post(title) {
  // authorId is filled by the caller-provided AUTHOR_ID env or first seeded user
  const r = await fetch(API + "/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, body: "x", authorId: process.env.AUTHOR_ID }),
  });
  return r.json();
}
async function feedTop() {
  const r = await fetch(API + "/posts/feed?sort=new");
  const feed = await r.json();
  return feed[0];
}

async function main() {
  if (!process.env.AUTHOR_ID) {
    console.error("Set AUTHOR_ID to a seeded user id (printed by `npm run seed`).");
    process.exit(1);
  }
  const a = await post("VERIFY-A-" + Date.now());
  let top = await feedTop();
  const okA = top && top.id === a.id;
  console.log(okA ? "PASS: feed fresh after first write" : "FAIL: feed stale after first write");

  const b = await post("VERIFY-B-" + Date.now());
  top = await feedTop();
  const okB = top && top.id === b.id;
  console.log(okB ? "PASS: feed fresh after second write (invalidation works)"
                  : "FAIL: feed served a CACHED older version — POST /posts is not invalidating");

  process.exit(okA && okB ? 0 : 1);
}
main();
