import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import { router, staffProcedure } from "../trpc";
import { DOC_STAGES, canAdvance, type DocStage } from "@ostentaculus/core/documentary/pipeline";

export const documentaryRouter = router({
  create: staffProcedure
    .input(z.object({ establishmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.db.execute<{ id: string }>(sql`
        INSERT INTO documentaries (establishment_id,status) VALUES (${input.establishmentId},'research')
        RETURNING id;`);
      return { id: rows[0]!.id, status: "research" as DocStage };
    }),

  advanceStatus: staffProcedure
    .input(z.object({ documentaryId: z.string().uuid(), to: z.enum(DOC_STAGES) }))
    .mutation(async ({ ctx, input }) => {
      const cur = await ctx.db.execute<{ status: DocStage }>(sql`
        SELECT status FROM documentaries WHERE id=${input.documentaryId};`);
      const from = cur[0]?.status;
      if (!from) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canAdvance(from, input.to)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Illegal transition ${from} -> ${input.to}` });
      }
      await ctx.db.execute(sql`
        UPDATE documentaries SET status=${input.to}, updated_at=now() WHERE id=${input.documentaryId};`);
      return { status: input.to };
    }),
});
