import { NextRequest, NextResponse } from "next/server";
import { put as vercelPut } from "@vercel/blob";

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

    // Use @vercel/blob server API to request an upload handle/url
    // pass `access: 'public'` in options and the server token in the third arg
    const res = await vercelPut(
      key,
      { access: "public", contentType },
      { token: SERVER_TOKEN },
    );

    // The SDK returns an object with url/downloadUrl/pathname; it may also include an uploadUrl for PUT
    const uploadUrl =
      (res as any).uploadUrl || (res as any).uploadURL || (res as any).url;
    const publicUrl =
      (res as any).url ||
      (res as any).downloadUrl ||
      `https://cdn.vercel.com/${key}`;

    return NextResponse.json({ url: uploadUrl, publicUrl, key, raw: res });
  } catch (err: any) {
    console.error("Presign (vercel blob sdk) error:", err?.message || err);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(err?.message || err) },
      { status: 500 },
    );
  }
}
