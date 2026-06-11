import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@ostentaculus/db/client";
import { getPublicEstablishment } from "@ostentaculus/core/public/feed";
import { rateLimit } from "@ostentaculus/core/http/rate-limit";

export const runtime = "nodejs";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS" };
const idSchema = z.string().uuid();

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const ip = req.headers.get("cf-connecting-ip") ?? "anon";
  if (!rateLimit(`est:${ip}`, 120, 60_000).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: CORS });
  }
  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400, headers: CORS });
  }
  const data = await getPublicEstablishment(db, id);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404, headers: CORS });
  return NextResponse.json({ data }, {
    status: 200,
    headers: { ...CORS, "Cache-Control": "public, max-age=300" },
  });
}
