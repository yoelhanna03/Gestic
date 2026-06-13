import { NextRequest, NextResponse } from "next/server";

const VERCEL_BLOB_TOKEN = process.env.VERCEL_BLOB_TOKEN;
const VERCEL_PROJECT =
  process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT;

export async function POST(req: NextRequest) {
  try {
    if (!VERCEL_BLOB_TOKEN) {
      return NextResponse.json(
        { error: "Vercel Blob not configured" },
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

    // Call Vercel Blob REST API to create an upload URL
    const apiRes = await fetch("https://api.vercel.com/v1/blob", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_BLOB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: key, mimeType: contentType }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => "");
      console.error("Vercel Blob API error:", apiRes.status, errText);
      return NextResponse.json(
        { error: "Failed to get upload URL from Vercel Blob" },
        { status: 502 },
      );
    }

    const json = await apiRes.json();
    // Expected fields: uploadURL (for PUT) and url (public read URL)
    const uploadUrl = json?.uploadURL || json?.uploadUrl || json?.url;
    const publicUrl =
      json?.url ||
      json?.publicUrl ||
      `https://cdn.vercel.com/${json?.key || key}`;

    return NextResponse.json({ url: uploadUrl, publicUrl, key });
  } catch (err) {
    console.error("Presign (vercel blob) error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
