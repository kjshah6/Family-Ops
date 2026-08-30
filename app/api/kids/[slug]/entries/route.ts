import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const kid = await db.kid.findUnique({ where: { slug: params.slug }, include: { entries: true } });
  if (!kid) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(kid.entries);
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json(); // { category: "sports"|"classes"|"pickup", data: {...} }
  const kid = await db.kid.findUnique({ where: { slug: params.slug } });
  if (!kid) return NextResponse.json({ error: "not found" }, { status: 404 });

  const entry = await db.scheduleEntry.create({
    data: {
      kidId: kid.id,
      category: body.category,
      data: body.data,
      createdBy: session.user.email,
    },
  });
  return NextResponse.json(entry);
}
