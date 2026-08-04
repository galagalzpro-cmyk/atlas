import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runOperationalCleanup } from "../../../lib/server/operations";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const cleaned = await runOperationalCleanup();
    return NextResponse.json({ ok: true, cleaned, timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "cleanup_failed" }, { status: 503 });
  }
}
