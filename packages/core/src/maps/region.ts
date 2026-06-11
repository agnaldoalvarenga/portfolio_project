import { getEnv } from "@ostentaculus/security/env";
import type { LatLng } from "./route";

interface GeocodeResponse {
  results?: { address_components?: { short_name: string; types: string[] }[] }[];
}

/**
 * Reverse-geocode a point to a first-level admin region (e.g. "CT" for
 * Catalunya) to cross-reference tourism insights. Degrades to null without a key.
 */
export async function resolveRegion(point: LatLng): Promise<string | null> {
  const env = getEnv();
  if (!env.GOOGLE_MAPS_API_KEY) return null;
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${point.latitude},${point.longitude}`);
  url.searchParams.set("result_type", "administrative_area_level_1");
  url.searchParams.set("key", env.GOOGLE_MAPS_API_KEY);
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = (await res.json()) as GeocodeResponse;
  const comp = body.results?.[0]?.address_components?.find((c) =>
    c.types.includes("administrative_area_level_1"),
  );
  return comp?.short_name ?? null;
}
