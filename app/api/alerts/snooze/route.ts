import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, days } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Placeholder: snooze logic would update expiration or create a snooze record.
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
