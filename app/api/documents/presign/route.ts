import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;

const s3Client = new S3Client({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      }
    : undefined,
});

export async function POST(req: NextRequest) {
  try {
    if (!REGION || !BUCKET || !process.env.AWS_ACCESS_KEY_ID) {
      return NextResponse.json({ error: "S3 not configured" }, { status: 500 });
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

    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "public-read",
    });

    const url = await getSignedUrl(s3Client, cmd, { expiresIn: 3600 });

    const publicUrl =
      process.env.S3_PUBLIC_URL ||
      `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(key)}`;

    return NextResponse.json({ url, publicUrl, key });
  } catch (err) {
    console.error("Presign error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
