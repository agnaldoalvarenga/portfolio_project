import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();
export const router = t.router;
export const publicProcedure = t.procedure;

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * Privileged surface (staff/admin/establishment_owner) MUST be at AAL2 — i.e.
 * the session passed an MFA challenge. Supabase stamps `aal` in the JWT.
 */
const requireMfaPrivileged = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const privileged = ["staff", "admin", "establishment_owner"];
  if (privileged.includes(ctx.user.role) && ctx.claims.aal !== "aal2") {
    throw new TRPCError({ code: "FORBIDDEN", message: "MFA required" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const authedProcedure = t.procedure.use(requireAuth);
export const staffProcedure = t.procedure.use(requireMfaPrivileged);

/** Service-to-service (n8n/workers): bearer token, no human session. */
export const serviceProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.serviceToken || ctx.serviceToken !== process.env.CONCIERGE_SERVICE_TOKEN) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  }),
);
