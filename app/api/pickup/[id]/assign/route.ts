import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SLOT_INCLUDE } from "@/lib/pickup";
import { toISODate } from "@/lib/dates";

// Sets or clears who is covering a slot — up to two people. This is a shared
// board: any signed-in parent may assign anyone, or change what someone else
// set. `assignedBy` records who made the change.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const raw: unknown[] = Array.isArray(body?.parentIds)
    ? body.parentIds
    : [body?.parentId ?? null];

  // Drop blanks and duplicates, keep at most two.
  const ids = Array.from(
    new Set(raw.filter((v): v is string => typeof v === "string" && v.length > 0)),
  ).slice(0, 2);

  if (ids.length > 0) {
    const found = await db.parent.count({ where: { id: { in: ids } } });
    if (found !== ids.length) {
      return NextResponse.json({ error: "parent not found" }, { status: 404 });
    }
  }

  const existing = await db.pickupSlot.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const slot = await db.pickupSlot.update({
    where: { id: params.id },
    data: {
      assignedParentId: ids[0] ?? null,
      assignedParent2Id: ids[1] ?? null,
      assignedBy: ids.length ? session.user.email : null,
      assignedAt: ids.length ? new Date() : null,
    },
    include: SLOT_INCLUDE,
  });

  return NextResponse.json({ ...slot, date: toISODate(slot.date) });
}
