import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, serviceProcedure } from "../trpc";
import { recommendEstablishment } from "@ostentaculus/core/concierge/recommend";
import { prepareUserText } from "@ostentaculus/core/concierge/guardrails";
import { resolveRegion } from "@ostentaculus/core/maps/region";
import { recordConciergeLead } from "@ostentaculus/core/leads/record";
import { getEnv } from "@ostentaculus/security/env";

export const conciergeRouter = router({
  recommend: serviceProcedure
    .input(z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      userText: z.string().max(4096).nullable(),
      contact: z.string().min(3).max(64).optional(), // tourist WhatsApp id (for lead attribution)
      locale: z.string().max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await recommendEstablishment(ctx.db, {
          point: { latitude: input.latitude, longitude: input.longitude },
          userText: prepareUserText(input.userText),
          locale: input.locale,
        });

        // FASE 3 — attribute the recommendation to the establishment as a lead.
        if (result.kind === "recommendation" && result.establishmentId && input.contact) {
          const region = await resolveRegion({ latitude: input.latitude, longitude: input.longitude });
          const lead = await recordConciergeLead(ctx.db, {
            establishmentId: result.establishmentId,
            contact: input.contact,
            salt: getEnv().LEAD_PSEUDONYM_SALT,
            region,
            recommendationText: result.text,
          });
          return { ...result, leadId: lead.id, leadIsNew: lead.isNew };
        }
        return result;
      } catch (err) {
        ctx.logger.error({ err }, "concierge.recommend failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),
});
