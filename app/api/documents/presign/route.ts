import { NextRequest, NextResponse } from "next/server";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";

const SERVER_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_TOKEN;

export async function POST(req: NextRequest) {
  try {
    if (!SERVER_TOKEN) {
      return NextResponse.json(
        { error: "Vercel Blob token not configured (BLOB_READ_WRITE_TOKEN)" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { filename, contentType } = body as {
      filename?: string;
      contentType?: string;
    };
    if (!filename || !contentType)
      return NextResponse.json(
        { error: "Missing filename or contentType" },
        { status: 400 },
      );

    const key = `documents/${Date.now()}-${filename.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;

    // Generate a short-lived client token the browser can use to upload directly
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: SERVER_TOKEN,
      pathname: key,
      access: "public",
      contentType,
    } as any);

    const publicUrl = `https://cdn.vercel.com/${key}`;

    return NextResponse.json({ clientToken, publicUrl, key });
  } catch (err: any) {
    console.error("Presign (vercel blob sdk) error:", err?.message || err);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(err?.message || err) },
      { status: 500 },
    );
  }
}
