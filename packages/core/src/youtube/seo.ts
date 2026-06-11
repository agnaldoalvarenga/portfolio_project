export function formatChapters(items: { seconds: number; label: string }[]): string {
  return items
    .map(({ seconds, label }) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${String(s).padStart(2, "0")} ${label}`;
    })
    .join("\n");
}

/** Dedupe, trim, cap per-tag and total length (YouTube ~500 char tag budget). */
export function sanitizeTags(tags: string[], maxTotal = 480): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  let total = 0;
  for (const raw of tags) {
    const t = raw.trim().replace(/[,\n]/g, " ").slice(0, 40);
    if (!t || seen.has(t.toLowerCase())) continue;
    if (total + t.length + 1 > maxTotal) break;
    seen.add(t.toLowerCase());
    out.push(t);
    total += t.length + 1;
  }
  return out;
}

/** Pinned comment with the conversion link. https-only, fail-closed. */
export function buildPinnedComment(cta: string, conversionUrl: string): string {
  const u = new URL(conversionUrl);
  if (u.protocol !== "https:") throw new Error("conversion URL must be https");
  return `${cta}\n${u.toString()}`;
}
