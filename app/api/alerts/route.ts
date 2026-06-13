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

    // Return pending alerts (Alert records) for the user's family or personal alerts
    const where: any = { isSent: false };
    if (familyId) where.document = { familyId };
    else where.document = { userId: user.id };

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
