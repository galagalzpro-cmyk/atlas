import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HEALTH_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
} as const;

export function GET() {
  return NextResponse.json({
    service: "atlas",
    status: "ok",
    timestamp: new Date().toISOString(),
  }, {
    status: 200,
    headers: HEALTH_HEADERS,
  });
}

export function HEAD() {
  return new Response(null, { status: 200, headers: HEALTH_HEADERS });
}
