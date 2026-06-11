import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { router, staffProcedure, authedProcedure } from "../trpc";
import { createRetainerCheckout } from "@ostentaculus/core/billing/checkout";
import { createConnectOnboarding } from "@ostentaculus/core/billing/connect";
import { TIERS } from "@ostentaculus/core/billing/tiers";
import { assertEstablishmentAccess } from "@ostentaculus/core/auth/access";

export const billingRouter = router({
  createCheckout: staffProcedure
    .input(z.object({
      establishmentId: z.string().uuid(),
      tier: z.enum(TIERS as unknown as [string, ...string[]]),
      customerEmail: z.string().email().optional(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const url = await createRetainerCheckout({ ...input, tier: input.tier as (typeof TIERS)[number] });
        return { url };
      } catch (err) {
        ctx.logger.error({ err }, "billing.createCheckout failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  connectOnboarding: staffProcedure
    .input(z.object({ establishmentId: z.string().uuid(), refreshUrl: z.string().url(), returnUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const url = await createConnectOnboarding(ctx.db, input);
        return { url };
      } catch (err) {
        ctx.logger.error({ err }, "billing.connectOnboarding failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  financialSummary: staffProcedure.query(async ({ ctx }) => {
    const subs = await ctx.db.execute(sql`
      SELECT tier, status, count(*)::int AS n FROM subscriptions GROUP BY tier, status;`);
    const commissions = await ctx.db.execute(sql`
      SELECT coalesce(sum(commission_cents),0)::bigint AS total_commission_cents, count(*)::int AS transfers
      FROM commissions;`);
    return { subscriptions: subs, commissions: commissions[0] ?? null };
  }),

  // Owner sees only their own establishment's subscription.
  mySubscription: authedProcedure
    .input(z.object({ establishmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        await assertEstablishmentAccess(ctx.db, ctx.user.id, ctx.user.role, input.establishmentId);
      } catch {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const rows = await ctx.db.execute(sql`
        SELECT tier, status, current_period_end AS "currentPeriodEnd"
        FROM subscriptions WHERE establishment_id = ${input.establishmentId} LIMIT 1;`);
      return rows[0] ?? null;
    }),
});
