import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc";

/**
 * TOTP enrollment via Supabase Auth MFA. Client renders `qrCode`, the user
 * scans it, then calls `verify`. Once verified, the next login challenge
 * elevates the session to aal2 (enforced by staffProcedure).
 */
export const authRouter = router({
  enrollTotp: authedProcedure.mutation(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Ostentaculus",
    });
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
  }),

  verifyTotp: authedProcedure
    .input(z.object({ factorId: z.string(), code: z.string().regex(/^\d{6}$/) }))
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.supabase.auth.mfa.challenge({ factorId: input.factorId });
      if (challenge.error) throw new TRPCError({ code: "BAD_REQUEST", message: challenge.error.message });
      const verify = await ctx.supabase.auth.mfa.verify({
        factorId: input.factorId,
        challengeId: challenge.data.id,
        code: input.code,
      });
      if (verify.error) throw new TRPCError({ code: "UNAUTHORIZED", message: verify.error.message });
      // TODO(non-critical): set users.mfa_enabled = true; write audit 'mfa.enrolled'
      return { ok: true };
    }),
});
