import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { TourismConnector, TourismPoint } from "../types";

/**
 * GA4 Analytics Data API — site traffic as a tourism demand signal.
 * Auth via GOOGLE_APPLICATION_CREDENTIALS (service account). Region "GA4".
 */
export class Ga4Connector implements TourismConnector {
  readonly source = "GA4" as const;
  private readonly client = new BetaAnalyticsDataClient();
  constructor(private readonly propertyId: string) {}

  async fetch(since: Date): Promise<TourismPoint[]> {
    const [report] = await this.client.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate: since.toISOString().slice(0, 10), endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }],
    });
    return (report.rows ?? []).map((r) => {
      const d = r.dimensionValues?.[0]?.value ?? "00000000"; // YYYYMMDD
      const period = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      return {
        source: "GA4" as const,
        region: "GA4",
        period,
        metric: "sessions",
        value: Number(r.metricValues?.[0]?.value ?? 0),
        unit: "count",
      };
    });
  }
}
