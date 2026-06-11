export interface PublicEstablishmentCard {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  youtubeVideoId: string | null;
}

/**
 * Whitelist mapper: only these fields ever leave the public API, even if a
 * query accidentally selects more. No PII, no POS, no internal status.
 */
export function toPublicCard(row: Record<string, unknown>): PublicEstablishmentCard {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    city: String(row.city),
    country: String(row.country),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    youtubeVideoId: row.youtubeVideoId == null ? null : String(row.youtubeVideoId),
  };
}
