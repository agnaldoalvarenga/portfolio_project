import type { PosAdapter, PosRecord } from "../types";

/** Deterministic-ish mock for local dev and demos before a real POS is wired. */
export class MockPosAdapter implements PosAdapter {
  async fetch(_establishmentId: string, since: Date): Promise<PosRecord[]> {
    const out: PosRecord[] = [];
    const DAY = 86_400_000;
    const heroes = ["Croissant", "Cortado", "Tarta de Santiago"];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(Math.floor((Date.now() - i * DAY) / DAY) * DAY);
      out.push({
        periodStart: dayStart,
        avgTicket: Number((8 + Math.random() * 6).toFixed(2)),
        peakHours: ["09:00", "13:00", "18:00"],
        heroProduct: heroes[i % heroes.length] ?? null,
      });
    }
    return out.filter((r) => r.periodStart >= since);
  }
}
