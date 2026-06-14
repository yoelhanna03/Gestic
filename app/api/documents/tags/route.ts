import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { getFamilyId } from "@/lib/session-helper";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("id");
    const body = await req.json();
    const { tags } = body as { tags: string[] };

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing document ID" },
        { status: 400 },
      );
    }

    const familyId = await getFamilyId(session.user.id);
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Verify ownership
    const allowed =
      (familyId && document.familyId === familyId) ||
      document.userId === session.user.id;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update tags
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { tags: tags || [] },
    });

    return NextResponse.json({ tags: updated.tags });
  } catch (error: any) {
    console.error("Update tags error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
