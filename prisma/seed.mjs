// Run once after `npm run db:push`: `node prisma/seed.mjs`
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const KIDS = [
  { slug: "nyra", name: "Nyra Shah", initials: "NS" },
  { slug: "eve", name: "Eve Edwards", initials: "EE" },
  { slug: "jack", name: "Jack Baker", initials: "JB" },
];

for (const kid of KIDS) {
  await db.kid.upsert({ where: { slug: kid.slug }, update: {}, create: kid });
}
console.log("Seeded kids.");
await db.$disconnect();
