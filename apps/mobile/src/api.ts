import Constants from "expo-constants";

const BASE: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? "https://app.ostentaculus.com";

export interface EstablishmentCard {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  youtubeVideoId: string | null;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

export const fetchFeed = () => getJson<EstablishmentCard[]>("/api/public/feed?limit=30");
export const fetchNearby = (lat: number, lng: number) =>
  getJson<EstablishmentCard[]>(`/api/public/discover?lat=${lat}&lng=${lng}&radius=3000`);
export const youtubeUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;
