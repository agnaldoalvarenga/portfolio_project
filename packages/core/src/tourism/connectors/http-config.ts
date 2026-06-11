import { safeFetchJson } from "../safe-fetch";
import type { TourismConnector, TourismPoint, TourismSource } from "../types";

/**
 * Config-driven connector for sources whose APIs vary (TravelBI, Hosteltur).
 * You provide the URL and a mapper from the raw payload to normalized points.
 * The host must be in the SSRF allowlist (safe-fetch.ts).
 */
export class HttpConfigConnector implements TourismConnector {
  constructor(
    readonly source: TourismSource,
    private readonly url: string,
    private readonly map: (raw: unknown) => TourismPoint[],
  ) {}

  async fetch(_since: Date): Promise<TourismPoint[]> {
    const raw = await safeFetchJson(this.url);
    return this.map(raw);
  }
}
