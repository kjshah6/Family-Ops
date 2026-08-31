// Idempotent: safe to re-run. Run with `npm run db:seed`.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const KIDS = [
  { slug: "nyra", name: "Nyra Shah", initials: "NS" },
  { slug: "eve", name: "Eve Edwards", initials: "EE" },
  { slug: "jack", name: "Jack Baker", initials: "JB" },
];

// `email` is only set for parents who actually sign in. Listing a parent here
// does NOT grant access — that's ALLOWED_PARENT_EMAILS. Fill in emails as
// people join; nothing else has to change.
const PARENTS = [
  { slug: "katie-baker", name: "Katie Baker", kidSlug: "jack", email: null },
  { slug: "rick-baker", name: "Rick Baker", kidSlug: "jack", email: null },
  // Slug stays "alison" so the upsert renames the existing row instead of
  // creating a second Alison alongside it.
  { slug: "alison", name: "Alison Ekizian", kidSlug: "eve", email: null },
  { slug: "ty-edwards", name: "Ty Edwards", kidSlug: "eve", email: null },
  { slug: "anshu-multani", name: "Anshu Multani", kidSlug: "nyra", email: null },
  { slug: "kunal-shah", name: "Kunal Shah", kidSlug: "nyra", email: "kjshah6@icloud.com" },
];

for (const kid of KIDS) {
  await db.kid.upsert({ where: { slug: kid.slug }, update: {}, create: kid });
}
console.log(`Seeded ${KIDS.length} kids.`);

for (const { kidSlug, ...parent } of PARENTS) {
  const kid = await db.kid.findUnique({ where: { slug: kidSlug } });
  if (!kid) throw new Error(`No kid with slug "${kidSlug}" for parent ${parent.name}`);
  await db.parent.upsert({
    where: { slug: parent.slug },
    update: { name: parent.name, email: parent.email, kidId: kid.id },
    create: { ...parent, kidId: kid.id },
  });
}
console.log(`Seeded ${PARENTS.length} parents.`);

await db.$disconnect();
