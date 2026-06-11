import { NextResponse } from "next/server";
import { db } from "@ostentaculus/db/client";
import { getPublicRoutes } from "@ostentaculus/core/public/feed";
import { rateLimit } from "@ostentaculus/core/http/rate-limit";

export const runtime = "nodejs";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: Request): Promise<Response> {
  const ip = req.headers.get("cf-connecting-ip") ?? "anon";
  if (!rateLimit(`routes:${ip}`, 120, 60_000).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: CORS });
  }
  const data = await getPublicRoutes(db);
  return NextResponse.json({ data }, {
    status: 200,
    headers: { ...CORS, "Cache-Control": "public, max-age=300" },
  });
}
