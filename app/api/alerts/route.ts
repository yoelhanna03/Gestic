import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    const familyId = user.familyId;
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "all", "critical", "unread"

    // Build where clause
    const where: any = {};
    if (familyId) {
      where.document = { familyId };
    } else {
      where.document = { userId: user.id };
    }

    // Only show alerts that haven't been snoozed
    where.snoozedUntil = { lte: new Date() };

    if (filter === "unread") {
      where.isRead = false;
    } else if (filter === "critical") {
      where.document = {
        ...where.document,
        expirationDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Within 7 days
          gt: new Date(), // Not expired
        },
      };
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: { document: true },
      orderBy: { triggerDate: "asc" },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
