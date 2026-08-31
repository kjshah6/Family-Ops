import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensurePickupSlots, navBounds, SLOT_INCLUDE } from "@/lib/pickup";
import { addDays, addWeeks, fromISODate, isValidISODate, mondayOfWeek, toISODate } from "@/lib/dates";

// How many weeks are shown at once. The window slides one week at a time.
const WEEKS_VISIBLE = 2;

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensurePickupSlots();

  const { minWeekStart, maxWeekStart } = navBounds();
  // Last start that still leaves a full window inside the horizon.
  const lastWindowStart = addWeeks(maxWeekStart, -(WEEKS_VISIBLE - 1));
  const clampMax = lastWindowStart < minWeekStart ? minWeekStart : lastWindowStart;

  const requested = req.nextUrl.searchParams.get("weekStart");

  let weekStart = minWeekStart;
  if (requested && isValidISODate(requested)) {
    const monday = mondayOfWeek(fromISODate(requested));
    if (monday < minWeekStart) weekStart = minWeekStart;
    else if (monday > clampMax) weekStart = clampMax;
    else weekStart = monday;
  }

  // Through Friday of the last visible week.
  const windowEnd = addDays(addWeeks(weekStart, WEEKS_VISIBLE - 1), 4);

  const [slots, holidays] = await Promise.all([
    db.pickupSlot.findMany({
      where: { date: { gte: weekStart, lte: windowEnd } },
      include: SLOT_INCLUDE,
      orderBy: [{ date: "asc" }, { type: "asc" }],
    }),
    db.holiday.findMany({
      where: { date: { gte: weekStart, lte: windowEnd } },
      orderBy: { date: "asc" },
    }),
  ]);

  return NextResponse.json({
    weekStart: toISODate(weekStart),
    windowEnd: toISODate(windowEnd),
    weeksVisible: WEEKS_VISIBLE,
    minWeekStart: toISODate(minWeekStart),
    maxWeekStart: toISODate(clampMax),
    slots: slots.map((s) => ({ ...s, date: toISODate(s.date) })),
    holidays: holidays.map((h) => ({ ...h, date: toISODate(h.date) })),
  });
}
