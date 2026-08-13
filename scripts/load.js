// Tiny cross-platform load harness (a wrk stand-in for Windows users).
// Fires N concurrent requests, reports req/s and p50/p99 latency.
// Usage: node scripts/load.js /posts/feed 50 2000
//   arg1 = path, arg2 = concurrency, arg3 = total requests
const API = process.env.API ?? "http://localhost:3000";
const path = process.argv[2] ?? "/posts/feed";
const concurrency = Number(process.argv[3] ?? 50);
const total = Number(process.argv[4] ?? 2000);

async function one() {
  const t = performance.now();
  await fetch(API + path);
  return performance.now() - t;
}

async function main() {
  const lat = [];
  let sent = 0;
  const start = performance.now();
  async function worker() {
    while (sent < total) {
      sent++;
      lat.push(await one());
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const secs = (performance.now() - start) / 1000;
  lat.sort((a, b) => a - b);
  const pct = (p) => lat[Math.floor((p / 100) * lat.length)].toFixed(1);
  console.log(`path=${path}  requests=${total}  concurrency=${concurrency}`);
  console.log(`req/s: ${(total / secs).toFixed(0)}`);
  console.log(`p50: ${pct(50)}ms   p99: ${pct(99)}ms`);
}
main();
