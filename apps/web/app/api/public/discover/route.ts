import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@ostentaculus/db/client";
import { discoverNearby } from "@ostentaculus/core/public/feed";
import { rateLimit } from "@ostentaculus/core/http/rate-limit";

export const runtime = "nodejs";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(20_000).default(3000),
});

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: Request): Promise<Response> {
  const ip = req.headers.get("cf-connecting-ip") ?? "anon";
  if (!rateLimit(`discover:${ip}`, 60, 60_000).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: CORS });
  }
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400, headers: CORS });

  // Tourist location is used in-memory only and never persisted (privacy by design).
  const data = await discoverNearby(db, { latitude: parsed.data.lat, longitude: parsed.data.lng }, parsed.data.radius);
  return NextResponse.json({ data }, {
    status: 200,
    headers: { ...CORS, "Cache-Control": "public, max-age=60" },
  });
}
