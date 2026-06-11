import { z } from "zod";

export const posRecord = z.object({
  periodStart: z.coerce.date(),
  avgTicket: z.number().nonnegative(),
  peakHours: z.array(z.string()),
  heroProduct: z.string().nullable().optional(),
});
export type PosRecord = z.infer<typeof posRecord>;

/** Pluggable POS source. Real adapters (e.g. Square, Lightspeed) implement this. */
export interface PosAdapter {
  fetch(establishmentId: string, since: Date): Promise<PosRecord[]>;
}
