import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const familyId = user.familyId;

    const cutoff = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const where = familyId ? { familyId, expirationDate: { lte: cutoff } } : { userId: user.id, expirationDate: { lte: cutoff } };

    const alerts = await prisma.document.findMany({
      where,
      orderBy: { expirationDate: "asc" },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
