import { safeFetchJson } from "../safe-fetch";
import type { TourismConnector, TourismPoint, TourismSource } from "../types";

interface IneDatum { Anyo: number; FK_Periodo: number; Valor: number | null }
interface IneSeries { Data?: IneDatum[] }

export interface IneConnectorConfig {
  source: TourismSource;   // INE | FRONTUR | EGATUR (all INE Tempus3 operations)
  tableCode: string;       // INE Tempus3 table id
  region: string;          // normalized region code
  metric: string;          // normalized metric name
  unit: string;            // "count" | "eur" | "nights"
  lastN?: number;          // periods to pull
}

/**
 * INE Tempus3 JSON API. FRONTUR/EGATUR are INE operations — same endpoint,
 * different table codes. Endpoint shape:
 *   https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/{tableCode}?nult=N
 * NOTE: validate the exact JSON shape against the live response per table.
 */
export class IneConnector implements TourismConnector {
  readonly source: TourismSource;
  constructor(private readonly cfg: IneConnectorConfig) { this.source = cfg.source; }

  async fetch(_since: Date): Promise<TourismPoint[]> {
    const n = this.cfg.lastN ?? 12;
    const url = `https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/${this.cfg.tableCode}?nult=${n}`;
    const raw = (await safeFetchJson(url)) as IneSeries[] | IneSeries;
    const series = Array.isArray(raw) ? raw : [raw];

    const points: TourismPoint[] = [];
    for (const s of series) {
      for (const d of s.Data ?? []) {
        if (d.Valor == null) continue;
        const month = String(d.FK_Periodo).slice(-2).padStart(2, "0");
        points.push({
          source: this.source,
          region: this.cfg.region,
          period: `${d.Anyo}-${month}`,
          metric: this.cfg.metric,
          value: d.Valor,
          unit: this.cfg.unit,
        });
      }
    }
    return points;
  }
}
