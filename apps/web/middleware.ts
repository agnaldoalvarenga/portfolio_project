import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["pt-BR", "es", "en"] as const;
const DEFAULT = "pt-BR";
const COUNTRY_LOCALE: Record<string, string> = { ES: "es", PT: "pt-BR", BR: "pt-BR", GB: "en", US: "en" };

function pickLocale(req: NextRequest): string {
  // 1) explicit cookie wins (manual choice is sticky)
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && (LOCALES as readonly string[]).includes(cookie)) return cookie;

  // 2) Accept-Language (user's OS/browser preference) beats geo
  const al = (req.headers.get("accept-language") ?? "").toLowerCase();
  for (const part of al.split(",")) {
    const tag = part.split(";")[0]!.trim();
    if (tag.startsWith("pt")) return "pt-BR";
    if (tag.startsWith("es")) return "es";
    if (tag.startsWith("en")) return "en";
  }
  // 3) GeoIP fallback (Vercel/Cloudflare header)
  const country = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry");
  if (country && COUNTRY_LOCALE[country]) return COUNTRY_LOCALE[country];
  return DEFAULT;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  const locale = pickLocale(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.redirect(url);
  res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return res;
}

export const config = {
  // skip api, static assets and files with an extension
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
