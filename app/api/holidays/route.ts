import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fromISODate, isValidISODate, toISODate } from "@/lib/dates";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const holidays = await db.holiday.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json({
    holidays: holidays.map((h) => ({ ...h, date: toISODate(h.date) })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { date, label } = body ?? {};

  if (typeof date !== "string" || !isValidISODate(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const trimmed = typeof label === "string" && label.trim() ? label.trim() : "No school";

  // Upsert so marking an already-marked day just renames it.
  const holiday = await db.holiday.upsert({
    where: { date: fromISODate(date) },
    update: { label: trimmed },
    create: { date: fromISODate(date), label: trimmed, createdBy: session.user.email },
  });

  return NextResponse.json({ ...holiday, date: toISODate(holiday.date) });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  if (!date || !isValidISODate(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  // Only the holiday marker is removed — pickup assignments on that day are
  // left untouched and simply become visible again.
  await db.holiday.deleteMany({ where: { date: fromISODate(date) } });
  return NextResponse.json({ ok: true });
}
