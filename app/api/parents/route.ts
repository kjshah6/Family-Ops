import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parents = await db.parent.findMany({
    include: { kid: { select: { slug: true, name: true, initials: true } } },
    orderBy: [{ kid: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json({ parents });
}
