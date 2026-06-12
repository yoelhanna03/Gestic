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
    const notifications = form.get("notifications") as string | null;

    const userId = session.user.id as string;

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (notifications) data.notificationsEnabled = notifications === "enabled";

    await prisma.user.update({ where: { id: userId }, data });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
