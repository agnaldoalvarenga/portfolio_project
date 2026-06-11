import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@ostentaculus/db/client";
import { getPublicFeed } from "@ostentaculus/core/public/feed";
import { rateLimit } from "@ostentaculus/core/http/rate-limit";

export const runtime = "nodejs";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(req: Request): Promise<Response> {
  const ip = req.headers.get("cf-connecting-ip") ?? "anon";
  if (!rateLimit(`feed:${ip}`, 120, 60_000).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: CORS });
  }
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400, headers: CORS });

  const data = await getPublicFeed(db, parsed.data.limit, parsed.data.offset);
  return NextResponse.json({ data }, {
    status: 200,
    headers: { ...CORS, "Cache-Control": "public, max-age=120" },
  });
}
