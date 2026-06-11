import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { LatLng } from "../maps/route";

export interface NearbyEstablishment {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  youtubeVideoId: string | null;
}

/**
 * Nearest curated, published establishment to a point within `radiusMeters`.
 * Haversine in SQL — no PostGIS extension required. Reads only public discovery
 * fields: NO POS data, NO PII. Hard-filters to curated + active so unvetted
 * rows never surface.
 */
export async function findNearestEstablishment(
  db: PostgresJsDatabase,
  point: LatLng,
  opts: { radiusMeters?: number; category?: string } = {},
): Promise<NearbyEstablishment | null> {
  const radius = opts.radiusMeters ?? 3000;
  const { latitude: lat, longitude: lng } = point;

  const rows = await db.execute<NearbyEstablishment>(sql`
    SELECT
      e.id, e.name, e.category, e.city, e.country, e.latitude, e.longitude,
      d.youtube_video_id AS "youtubeVideoId",
      (6371000 * acos(
         least(1, cos(radians(${lat})) * cos(radians(e.latitude))
         * cos(radians(e.longitude) - radians(${lng}))
         + sin(radians(${lat})) * sin(radians(e.latitude))))
      ) AS "distanceMeters"
    FROM establishments e
    LEFT JOIN documentaries d
      ON d.establishment_id = e.id AND d.status = 'published'
    WHERE e.curation_status = 'curated'
      AND e.status = 'active'
      ${opts.category ? sql`AND e.category = ${opts.category}` : sql``}
    HAVING (6371000 * acos(
         least(1, cos(radians(${lat})) * cos(radians(e.latitude))
         * cos(radians(e.longitude) - radians(${lng}))
         + sin(radians(${lat})) * sin(radians(e.latitude))))
      ) <= ${radius}
    ORDER BY "distanceMeters" ASC
    LIMIT 1;
  `);

  return rows[0] ?? null;
}
