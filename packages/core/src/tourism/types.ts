import { z } from "zod";

export const TOURISM_SOURCES = ["INE", "FRONTUR", "EGATUR", "TravelBI", "Hosteltur", "GA4"] as const;
export type TourismSource = (typeof TOURISM_SOURCES)[number];

/** Normalized series point — the single shape every connector maps into. */
export const tourismPoint = z.object({
  source: z.enum(TOURISM_SOURCES),
  region: z.string().min(1),   // e.g. "ES-CT" (Catalunya), "PT-11" (Lisboa), "GA4"
  period: z.string().min(4),   // ISO month "2026-05" or date "2026-05-13"
  metric: z.string().min(1),   // "overnight_stays" | "arrivals" | "avg_spend" | "sessions"
  value: z.number(),
  unit: z.string().min(1),     // "count" | "eur" | "nights"
});
export type TourismPoint = z.infer<typeof tourismPoint>;

export interface TourismConnector {
  readonly source: TourismSource;
  fetch(since: Date): Promise<TourismPoint[]>;
}
