import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Simulate a slow, disk-backed / joined query so caching shows a real win.
// In a real service this delay is the database itself. Tune with SLOW_MS.
const SLOW_MS = Number(process.env.SLOW_MS ?? 40);
export const slowQuery = () => new Promise((r) => setTimeout(r, SLOW_MS));
