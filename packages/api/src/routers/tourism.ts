import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { router, staffProcedure } from "../trpc";
import { answerTourismQuestion } from "@ostentaculus/ai/tourism-rag";
import { TOURISM_SOURCES } from "@ostentaculus/core/tourism/types";

export const tourismRouter = router({
  // Numeric series for charts (staff/admin only — internal analytics).
  series: staffProcedure
    .input(z.object({
      source: z.enum(TOURISM_SOURCES).optional(),
      region: z.string().optional(),
      metric: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(120),
    }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.execute(sql`
        SELECT source, region, period, metric, value::float8 AS value, unit
        FROM tourism_data
        WHERE (${input.source ?? null}::text IS NULL OR source = ${input.source ?? null})
          AND (${input.region ?? null}::text IS NULL OR region = ${input.region ?? null})
          AND (${input.metric ?? null}::text IS NULL OR metric = ${input.metric ?? null})
        ORDER BY period DESC
        LIMIT ${input.limit};`);
      return rows;
    }),

  // RAG insight: "when/where to capture tourists".
  insights: staffProcedure
    .input(z.object({ question: z.string().min(8).max(500) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await answerTourismQuestion(ctx.db, input.question);
      } catch (err) {
        ctx.logger.error({ err }, "tourism.insights failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
