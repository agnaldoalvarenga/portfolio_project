import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { findNearestEstablishment } from "./geofencing";
import { buildWalkingRouteUrl, buildYouTubeWatchUrl, type LatLng } from "../maps/route";
import { composeConciergeMessage } from "@ostentaculus/ai/concierge";
import { redactPII } from "./pii";

export interface RecommendInput {
  point: LatLng;
  userText: string | null;
  locale?: string;
}

export interface RecommendOutput {
  kind: "recommendation" | "no_match" | "refused";
  text: string;
  establishmentId?: string;
  videoUrl?: string | null;
  routeUrl?: string;
}

/** geofence -> compose -> attach verified links (YouTube + walking route). */
export async function recommendEstablishment(
  db: PostgresJsDatabase,
  input: RecommendInput,
): Promise<RecommendOutput> {
  const establishment = await findNearestEstablishment(db, input.point);
  if (!establishment) {
    return {
      kind: "no_match",
      text: "Aún no tenemos un establecimiento curado muy cerca de ti, pero estamos ampliando nuestra selección. ¿Quieres que te avisemos cuando lo tengamos?",
    };
  }

  const composed = await composeConciergeMessage({
    userText: input.userText ? redactPII(input.userText) : null,
    establishment,
    locale: input.locale,
  });

  if (composed.refused) {
    return { kind: "refused", text: "Estoy aquí para recomendarte experiencias gastronómicas curadas. ¿Te muestro un lugar cercano?" };
  }

  return {
    kind: "recommendation",
    text: composed.message,
    establishmentId: establishment.id,
    videoUrl: establishment.youtubeVideoId ? buildYouTubeWatchUrl(establishment.youtubeVideoId) : null,
    routeUrl: buildWalkingRouteUrl(input.point, {
      latitude: establishment.latitude,
      longitude: establishment.longitude,
    }),
  };
}
