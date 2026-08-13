// Seeds a few users and posts so the read endpoints return real data.
// Run once: npm run db:push && npm run seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const alice = await prisma.user.create({ data: { name: "Alice", bio: "Builds things." } });
  const bob   = await prisma.user.create({ data: { name: "Bob",   bio: "Breaks things." } });

  const authors = [alice.id, bob.id];
  for (let i = 1; i <= 40; i++) {
    await prisma.post.create({
      data: {
        title: `Post #${i}`,
        body: `This is the body of post number ${i}.`,
        likes: Math.floor(Math.random() * 500),
        authorId: authors[i % 2],
      },
    });
  }
  console.log("Seeded 2 users and 40 posts.");
  console.log("A user id to test GET /users/:id ->", alice.id);
}

main().finally(() => prisma.$disconnect());
