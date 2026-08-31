import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SLOT_INCLUDE } from "@/lib/pickup";
import { isValidSlotTime, toISODate } from "@/lib/dates";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const timeMinutes = body?.timeMinutes;

  if (!isValidSlotTime(timeMinutes)) {
    return NextResponse.json({ error: "invalid time" }, { status: 400 });
  }

  const existing = await db.pickupSlot.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const slot = await db.pickupSlot.update({
    where: { id: params.id },
    data: { timeMinutes },
    include: SLOT_INCLUDE,
  });

  return NextResponse.json({ ...slot, date: toISODate(slot.date) });
}
