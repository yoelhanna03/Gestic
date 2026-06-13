import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const headersObj: any = {};
    // copy headers from Request to an object compatible with better-auth
    (req.headers as any).forEach(
      (value: string, key: string) => (headersObj[key] = value),
    );

    const session = await auth.api.getSession({ headers: headersObj });
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const name = form.get("name") as string | null;
    const email = form.get("email") as string | null;
    // `notifications` is accepted from the form but not present on the Prisma schema.
    // We ignore unknown fields to avoid PrismaClientValidationError.

    const userId = session.user.id as string;

    // Only allow a small, explicit set of updatable fields to be sent to Prisma.
    const allowed: any = {};
    if (name && typeof name === "string" && name.trim().length > 0) {
      allowed.name = name.trim();
    }
    if (email && typeof email === "string" && email.trim().length > 0) {
      // basic sanity check for email format
      const e = email.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }
      allowed.email = e;
    }

    if (Object.keys(allowed).length === 0) {
      // Nothing to update; return success to avoid throwing, or return 400 if desired.
      return NextResponse.json({ ok: true });
    }

    await prisma.user.update({ where: { id: userId }, data: allowed });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
