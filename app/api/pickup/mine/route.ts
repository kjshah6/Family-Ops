import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensurePickupSlots, navBounds, SLOT_INCLUDE } from "@/lib/pickup";
import { toISODate } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensurePickupSlots();

  // "Mine" means the Parent record carrying this login's email. A signed-in
  // parent who isn't in the Parent table yet simply has nothing assigned.
  const me = await db.parent.findUnique({ where: { email: session.user.email } });
  if (!me) return NextResponse.json({ slots: [], parentKnown: false });

  const { minWeekStart, horizonEnd } = navBounds();

  const slots = await db.pickupSlot.findMany({
    where: {
      OR: [{ assignedParentId: me.id }, { assignedParent2Id: me.id }],
      date: { gte: minWeekStart, lte: horizonEnd },
    },
    include: SLOT_INCLUDE,
    orderBy: [{ date: "asc" }, { type: "asc" }],
  });

  return NextResponse.json({
    parentKnown: true,
    slots: slots.map((s) => ({ ...s, date: toISODate(s.date) })),
  });
}
