import { router } from "./trpc";
import { conciergeRouter } from "./routers/concierge";
import { authRouter } from "./routers/auth";
import { establishmentRouter } from "./routers/establishment";
import { documentaryRouter } from "./routers/documentary";
import { dashboardRouter } from "./routers/dashboard";
import { tourismRouter } from "./routers/tourism";
import { marketingRouter } from "./routers/marketing";
import { billingRouter } from "./routers/billing";

export const appRouter = router({
  concierge: conciergeRouter,
  auth: authRouter,
  establishment: establishmentRouter,
  documentary: documentaryRouter,
  dashboard: dashboardRouter,
  tourism: tourismRouter,
  marketing: marketingRouter,
  billing: billingRouter,
});
export type AppRouter = typeof appRouter;
