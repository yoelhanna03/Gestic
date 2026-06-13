import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename, data } = body as { filename?: string; data?: string };
    if (!data)
      return NextResponse.json({ error: "Missing data" }, { status: 400 });

    // data expected as data:<mime>;base64,<b64>
    const matches = data.match(/^data:(.+);base64,(.+)$/);
    if (!matches)
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 },
      );

    const mime = matches[1];
    const b64 = matches[2];

    const ext = (mime.split("/")[1] || "bin").split("+")[0];
    const name = filename
      ? path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, "_")
      : `upload-${Date.now()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const outPath = path.join(uploadsDir, name);
    fs.writeFileSync(outPath, Buffer.from(b64, "base64"));

    const url = `/uploads/${encodeURIComponent(name)}`;
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
