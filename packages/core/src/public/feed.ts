import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { toPublicCard, type PublicEstablishmentCard } from "./dto";
import type { LatLng } from "../maps/route";

/** All reads go through public_* views: safe columns, curated/published only. */
export async function getPublicFeed(
  db: PostgresJsDatabase, limit = 20, offset = 0,
): Promise<PublicEstablishmentCard[]> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT id, name, category, city, country, latitude, longitude,
           youtube_video_id AS "youtubeVideoId"
    FROM public_establishments ORDER BY name ASC LIMIT ${limit} OFFSET ${offset};`);
  return rows.map(toPublicCard);
}

export async function getPublicEstablishment(
  db: PostgresJsDatabase, id: string,
): Promise<PublicEstablishmentCard | null> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT id, name, category, city, country, latitude, longitude,
           youtube_video_id AS "youtubeVideoId"
    FROM public_establishments WHERE id = ${id} LIMIT 1;`);
  return rows[0] ? toPublicCard(rows[0]) : null;
}

export async function discoverNearby(
  db: PostgresJsDatabase, point: LatLng, radiusMeters = 3000, limit = 20,
): Promise<PublicEstablishmentCard[]> {
  const { latitude: lat, longitude: lng } = point;
  const rows = await db.execute<Record<string, unknown>>(sql`
    SELECT id, name, category, city, country, latitude, longitude,
           youtube_video_id AS "youtubeVideoId"
    FROM public_establishments
    WHERE (6371000 * acos(least(1, cos(radians(${lat}))*cos(radians(latitude))
          *cos(radians(longitude)-radians(${lng}))+sin(radians(${lat}))*sin(radians(latitude))))) <= ${radiusMeters}
    ORDER BY (6371000 * acos(least(1, cos(radians(${lat}))*cos(radians(latitude))
          *cos(radians(longitude)-radians(${lng}))+sin(radians(${lat}))*sin(radians(latitude))))) ASC
    LIMIT ${limit};`);
  return rows.map(toPublicCard);
}

export async function getPublicRoutes(db: PostgresJsDatabase): Promise<unknown[]> {
  const rows = await db.execute(sql`SELECT id, name, description, region, stops FROM public_routes;`);
  return rows;
}
