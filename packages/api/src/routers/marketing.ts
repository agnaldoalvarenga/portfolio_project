import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { router, staffProcedure } from "../trpc";
import { planEditorialCalendar } from "@ostentaculus/ai/marketing/chief-of-staff";
import { analyzeAudience } from "@ostentaculus/ai/marketing/audience-intelligence";
import { generateVideoBrief } from "@ostentaculus/ai/marketing/storytelling";
import { generateDistribution } from "@ostentaculus/ai/marketing/distribution-seo";

/** AI marketing department — staff/admin only (AAL2). */
export const marketingRouter = router({
  plan: staffProcedure
    .input(z.object({ brand: z.string().default("Ostentaculus"), tourismInsights: z.string().optional(), count: z.number().int().min(1).max(10).default(4), locale: z.string().max(10).optional() }))
    .mutation(async ({ ctx, input }) => {
      const briefs = await planEditorialCalendar(input);
      for (const b of briefs) {
        await ctx.db.execute(sql`
          INSERT INTO content_briefs (topic, region, angle, status)
          VALUES (${b.topic}, ${b.region}, ${b.angle}, 'planned');`);
      }
      return briefs;
    }),

  audience: staffProcedure
    .input(z.object({ niche: z.string().min(3).max(120) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await analyzeAudience(input.niche);
      } catch (err) {
        ctx.logger.error({ err }, "marketing.audience failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  script: staffProcedure
    .input(z.object({
      briefId: z.string().uuid().optional(),
      topic: z.string().min(3),
      audienceSignals: z.string().optional(),
      establishmentName: z.string().optional(),
      locale: z.string().max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const brief = await generateVideoBrief(input);
      if (input.briefId) {
        await ctx.db.execute(sql`
          UPDATE content_briefs SET brief = ${JSON.stringify(brief)}::jsonb, status = 'scripted', updated_at = now()
          WHERE id = ${input.briefId};`);
      }
      return brief;
    }),

  distribution: staffProcedure
    .input(z.object({
      briefId: z.string().uuid().optional(),
      title: z.string().min(3),
      script: z.string().min(20),
      conversionUrl: z.string().url(),
      locale: z.string().max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const dist = await generateDistribution(input);
      if (input.briefId) {
        await ctx.db.execute(sql`
          UPDATE content_briefs SET distribution = ${JSON.stringify(dist)}::jsonb, updated_at = now()
          WHERE id = ${input.briefId};`);
      }
      return dist;
    }),
});
