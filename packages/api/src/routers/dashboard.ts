import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { router, authedProcedure } from "../trpc";
import { assertEstablishmentAccess } from "@ostentaculus/core/auth/access";
import { getEstablishmentKpis } from "@ostentaculus/core/dashboard/kpis";

async function guard(ctx: { db: Parameters<typeof getEstablishmentKpis>[0]; user: { id: string; role: string } }, establishmentId: string) {
  try {
    await assertEstablishmentAccess(ctx.db, ctx.user.id, ctx.user.role, establishmentId);
  } catch {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

export const dashboardRouter = router({
  kpis: authedProcedure
    .input(z.object({ establishmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await guard(ctx, input.establishmentId);
      return getEstablishmentKpis(ctx.db, input.establishmentId);
    }),

  latestReport: authedProcedure
    .input(z.object({ establishmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await guard(ctx, input.establishmentId);
      const rows = await ctx.db.execute(sql`
        SELECT narrative, period_start AS "periodStart", period_end AS "periodEnd",
               generated_at AS "generatedAt"
        FROM weekly_reports WHERE establishment_id=${input.establishmentId}
        ORDER BY generated_at DESC LIMIT 1;`);
      return rows[0] ?? null;
    }),
});
