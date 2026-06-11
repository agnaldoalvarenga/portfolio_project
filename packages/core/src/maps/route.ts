export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Walking-directions deep link. No API key, no PII leaves our server. */
export function buildWalkingRouteUrl(origin: LatLng, destination: LatLng): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", `${origin.latitude},${origin.longitude}`);
  url.searchParams.set("destination", `${destination.latitude},${destination.longitude}`);
  url.searchParams.set("travelmode", "walking");
  return url.toString();
}

/** Public YouTube watch URL from a video id (validates charset). */
export function buildYouTubeWatchUrl(videoId: string): string {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new Error("Invalid YouTube video id");
  return `https://www.youtube.com/watch?v=${videoId}`;
}
