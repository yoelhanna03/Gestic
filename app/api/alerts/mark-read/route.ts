import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Ensure the alert belongs to the user's family or user
    const alert = await prisma.alert.findUnique({ where: { id }, include: { document: true } });
    if (!alert) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const user = session.user as any;
    const familyId = user.familyId;
    const doc = alert.document;
    const allowed = (familyId && doc.familyId === familyId) || doc.userId === user.id;
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.alert.update({ where: { id }, data: { isSent: true } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
