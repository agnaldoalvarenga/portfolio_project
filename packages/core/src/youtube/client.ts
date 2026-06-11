import { getEnv } from "@ostentaculus/security/env";

const HOST = "youtube.googleapis.com";

interface SearchResponse {
  items?: { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string } }[];
}
interface CommentResponse {
  items?: { snippet?: { topLevelComment?: { snippet?: { textOriginal?: string } } } }[];
}

export interface YoutubeSearchHit { title: string; channelTitle: string; videoId: string }

/** Build a keyed YouTube Data API v3 URL (host pinned). */
export function buildApiUrl(path: string, params: Record<string, string>): string {
  const env = getEnv();
  if (!env.YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY not set");
  const url = new URL(`https://${HOST}/youtube/v3/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("key", env.YOUTUBE_API_KEY);
  return url.toString();
}

async function getJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const res = await fetch(buildApiUrl(path, params));
  if (!res.ok) throw new Error(`YouTube API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function searchVideos(query: string, maxResults = 10): Promise<YoutubeSearchHit[]> {
  const data = await getJson<SearchResponse>("search", {
    part: "snippet", type: "video", q: query, maxResults: String(maxResults), order: "viewCount",
  });
  return (data.items ?? []).map((i) => ({
    title: i.snippet?.title ?? "",
    channelTitle: i.snippet?.channelTitle ?? "",
    videoId: i.id?.videoId ?? "",
  }));
}

export async function fetchTopComments(videoId: string, maxResults = 20): Promise<string[]> {
  const data = await getJson<CommentResponse>("commentThreads", {
    part: "snippet", videoId, maxResults: String(maxResults), order: "relevance",
  });
  return (data.items ?? [])
    .map((i) => i.snippet?.topLevelComment?.snippet?.textOriginal ?? "")
    .filter((t) => t.length > 0);
}

export { HOST as YOUTUBE_API_HOST };
