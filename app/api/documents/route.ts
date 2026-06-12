import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { documentSchema } from "@/lib/validations/document";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    if (!user.familyId) {
      return NextResponse.json({ documents: [] }, { status: 200 });
    }

    const documents = await prisma.document.findMany({
      where: { familyId: user.familyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Session
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    // 2. Validate Input
    const body = await req.json();
    const validatedData = documentSchema.parse(body);

    // 3. Find/Create Family
    let familyId = user.familyId;
    if (!familyId) {
      const family = await prisma.family.create({
        data: {
          name: `${user.name}'s Family`,
        },
      });
      familyId = family.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { familyId },
      });
    }

    // --- STRIPE RESTRICTION LOGIC ---
    const subscription = await prisma.subscription.findUnique({
      where: { familyId },
    });

    if (subscription?.plan === 'FREE') {
      const docCount = await prisma.document.count({
        where: { familyId },
      });

      if (docCount >= 3) {
        return NextResponse.json(
          { error: "Limite atteinte pour le plan Gratuit (3 documents max). Passez au Premium pour en ajouter davantage." },
          { status: 403 }
        );
      }
    }
    // -------------------------------

    // 4. Create Document
    const document = await prisma.document.create({
      data: {
        ...validatedData,
        userId: user.id,
        familyId: familyId,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
