import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Removes a per-kid override. Family-wide slots are never deletable, and a slot
// the other parent has claimed is left alone so nobody's commitment disappears.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const slot = await db.pickupSlot.findUnique({ where: { id: params.id } });
  if (!slot) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (!slot.kidId) {
    return NextResponse.json({ error: "cannot remove a family-wide slot" }, { status: 400 });
  }

  await db.pickupSlot.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
