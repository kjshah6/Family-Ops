import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSlotType, slotKeyFor, SLOT_INCLUDE, defaultTimeFor } from "@/lib/pickup";
import { fromISODate, isValidISODate, toISODate } from "@/lib/dates";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, type, kidSlug } = body ?? {};

  if (typeof date !== "string" || !isValidISODate(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }
  if (!isSlotType(type)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const kid = await db.kid.findUnique({ where: { slug: String(kidSlug) } });
  if (!kid) return NextResponse.json({ error: "kid not found" }, { status: 404 });

  const slotKey = slotKeyFor(date, type, kid.id);

  // Upsert keeps a double-tap from creating two overrides.
  const slot = await db.pickupSlot.upsert({
    where: { slotKey },
    update: {},
    create: {
      date: fromISODate(date),
      type,
      kidId: kid.id,
      slotKey,
      timeMinutes: defaultTimeFor(type),
    },
    include: SLOT_INCLUDE,
  });

  return NextResponse.json({ ...slot, date: toISODate(slot.date) });
}
