import { z } from "zod";
import { sql } from "drizzle-orm";
import { router, staffProcedure } from "../trpc";

export const establishmentRouter = router({
  create: staffProcedure
    .input(z.object({
      orgId: z.string().uuid(),
      name: z.string().min(1),
      category: z.string().min(1),
      city: z.string().min(1),
      country: z.string().length(2),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      ownerUserId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const rows = await ctx.db.execute<{ id: string }>(sql`
        INSERT INTO establishments (org_id,name,category,city,country,latitude,longitude,curation_status,status)
        VALUES (${input.orgId},${input.name},${input.category},${input.city},${input.country},
                ${input.latitude},${input.longitude},'pending','active')
        RETURNING id;`);
      const id = rows[0]!.id;
      if (input.ownerUserId) {
        await ctx.db.execute(sql`
          INSERT INTO establishment_members (establishment_id,user_id)
          VALUES (${id},${input.ownerUserId}) ON CONFLICT DO NOTHING;`);
      }
      return { id };
    }),

  connectPos: staffProcedure
    .input(z.object({ establishmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.execute(sql`
        UPDATE establishments SET pos_connected='true', updated_at=now()
        WHERE id=${input.establishmentId};`);
      return { ok: true };
    }),
});
