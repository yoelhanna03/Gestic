import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient, Prisma } from "@prisma/client";
import { getFamilyId } from "@/lib/session-helper";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, days } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: { document: true },
    });
    if (!alert)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const familyId = await getFamilyId(session.user.id);
    const doc = alert.document;
    const allowed =
      (familyId && doc.familyId === familyId) || doc.userId === session.user.id;
    if (!allowed)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const daysNum = typeof days === "number" ? days : parseInt(days || "7", 10);
    const snoozedUntil = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000);

    const updateData: Prisma.AlertUpdateInput = {
      snoozedUntil,
      isRead: false,
    };

    await prisma.alert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
