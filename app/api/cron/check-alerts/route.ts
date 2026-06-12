import { NextRequest, NextResponse } from "next/server";
import { scanExpiringDocuments } from "@/lib/services/alert-scanner";

export async function GET(req: NextRequest) {
  // In a real production environment, you should verify a secret key
  // passed in the headers or as a query parameter to prevent public triggers.
  const { searchParams } = new URL(req.url);
  const cronKey = searchParams.get("key");

  if (process.env.CRON_SECRET && cronKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized: Invalid Cron Secret" }, { status: 401 });
  }

  try {
    const result = await scanExpiringDocuments();
    return NextResponse.json({
      success: true,
      message: "Alert scan completed",
      ...result,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * HOW TO AUTOMATE THIS ROUTE:
 *
 * 1. Using Vercel Cron Jobs:
 *    Add a 'cron' field to your vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/check-alerts",
 *        "schedule": "0 0 * * *"
 *      }]
 *    }
 *
 * 2. Using Upstash Workflow or similar:
 *    Set up a scheduled HTTP GET request to:
 *    https://your-domain.com/api/cron/check-alerts?key=${process.env.CRON_SECRET}
 *
 * 3. Frequency recommendation:
 *    Run this once every 24 hours (midnight) to keep alerts up-to-date.
 */
