import {
  pgTable, uuid, text, timestamp, numeric, jsonb, pgEnum, index, uniqueIndex, vector, integer,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "tourist", "resident", "staff", "establishment_owner", "admin",
]);
export const curationStatus = pgEnum("curation_status", ["pending", "in_review", "curated"]);
export const establishmentStatus = pgEnum("establishment_status", ["active", "paused", "archived"]);
export const documentaryStatus = pgEnum("documentary_status", ["research", "shoot", "edit", "published"]);

const stamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ...stamps,
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // = auth.users.id
  email: text("email"),
  role: userRole("role").notNull().default("tourist"),
  locale: text("locale").notNull().default("es"),
  mfaEnabled: text("mfa_enabled").notNull().default("false"),
  phoneEnc: text("phone_enc"),   // AES-256-GCM at rest (see encrypted.ts)
  phoneHash: text("phone_hash"), // pseudonymous lookup key
  ...stamps,
});

export const orgMembers = pgTable("org_members", {
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: userRole("role").notNull(),
  ...stamps,
}, (t) => ({ pk: uniqueIndex("org_members_pk").on(t.orgId, t.userId) }));

export const establishments = pgTable("establishments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
  curationStatus: curationStatus("curation_status").notNull().default("pending"),
  status: establishmentStatus("status").notNull().default("active"),
  posConnected: text("pos_connected").notNull().default("false"),
  ...stamps,
}, (t) => ({ orgIdx: index("establishments_org_idx").on(t.orgId) }));

export const establishmentMembers = pgTable("establishment_members", {
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ...stamps,
}, (t) => ({ pk: uniqueIndex("establishment_members_pk").on(t.establishmentId, t.userId) }));

export const documentaries = pgTable("documentaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  status: documentaryStatus("status").notNull().default("research"),
  youtubeVideoId: text("youtube_video_id"),
  muxAssetId: text("mux_asset_id"), // reserved for future signed-playback migration
  ...stamps,
}, (t) => ({ estIdx: index("documentaries_est_idx").on(t.establishmentId) }));

// SENSITIVE: cash-register data — the crown jewel RLS must protect.
export const posMetrics = pgTable("pos_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  avgTicket: numeric("avg_ticket", { precision: 12, scale: 2 }).notNull(),
  peakHours: jsonb("peak_hours").notNull(),
  heroProduct: text("hero_product"),
  ...stamps,
}, (t) => ({ estIdx: index("pos_metrics_est_idx").on(t.establishmentId) }));

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  subject: text("subject"),
  metadata: jsonb("metadata"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull(),
  legalBasis: text("legal_basis").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  ...stamps,
});

export const whatsappEvents = pgTable("whatsapp_events", {
  wamid: text("wamid").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weeklyReports = pgTable("weekly_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  narrative: text("narrative").notNull(),
  kpisSnapshot: jsonb("kpis_snapshot").notNull(),
  model: text("model").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ estIdx: index("weekly_reports_est_idx").on(t.establishmentId) }));

export const tourismSource = pgEnum("tourism_source", [
  "INE", "FRONTUR", "EGATUR", "TravelBI", "Hosteltur", "GA4",
]);

export const tourismData = pgTable("tourism_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: tourismSource("source").notNull(),
  region: text("region").notNull(),
  period: text("period").notNull(),
  metric: text("metric").notNull(),
  value: numeric("value", { precision: 18, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  ...stamps,
}, (t) => ({ uniq: uniqueIndex("tourism_data_uniq").on(t.source, t.region, t.period, t.metric) }));

export const tourismDocuments = pgTable("tourism_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  region: text("region").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1024 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: uniqueIndex("tourism_documents_uniq").on(t.source, t.region, t.content) }));

export const leadStatus = pgEnum("lead_status", ["new", "engaged", "converted", "lost"]);

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  contactEnc: text("contact_enc"),
  contactHash: text("contact_hash").notNull(),
  region: text("region"),
  recommendationText: text("recommendation_text"),
  status: leadStatus("status").notNull().default("new"),
  recommendationsCount: integer("recommendations_count").notNull().default(1),
  lastRecommendedAt: timestamp("last_recommended_at", { withTimezone: true }).notNull().defaultNow(),
  ...stamps,
}, (t) => ({ uniq: uniqueIndex("leads_est_contact_uniq").on(t.establishmentId, t.contactHash) }));

export const conversions = pgTable("conversions", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  value: numeric("value", { precision: 12, scale: 2 }),
  convertedAt: timestamp("converted_at", { withTimezone: true }).notNull().defaultNow(),
  ...stamps,
}, (t) => ({ estIdx: index("conversions_est_idx").on(t.establishmentId) }));

export const contentStatus = pgEnum("content_status", ["planned", "scripted", "recorded", "published"]);

export const contentBriefs = pgTable("content_briefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  establishmentId: uuid("establishment_id").references(() => establishments.id, { onDelete: "set null" }),
  topic: text("topic").notNull(),
  region: text("region"),
  angle: text("angle"),
  audienceSignals: jsonb("audience_signals"),
  brief: jsonb("brief"),
  distribution: jsonb("distribution"),
  status: contentStatus("status").notNull().default("planned"),
  ...stamps,
}, (t) => ({ estIdx: index("content_briefs_est_idx").on(t.establishmentId) }));

export const routeStatus = pgEnum("route_status", ["draft", "curated", "published"]);

export const routes = pgTable("routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  region: text("region"),
  status: routeStatus("status").notNull().default("draft"),
  ...stamps,
});

export const routeStops = pgTable("route_stops", {
  routeId: uuid("route_id").notNull().references(() => routes.id, { onDelete: "cascade" }),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  ...stamps,
}, (t) => ({ pk: uniqueIndex("route_stops_pk").on(t.routeId, t.position) }));

export const subscriptionTier = pgEnum("subscription_tier", ["starter", "growth", "scale"]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  tier: subscriptionTier("tier").notNull(),
  status: text("status").notNull().default("incomplete"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  ...stamps,
}, (t) => ({ uniq: uniqueIndex("subscriptions_est_uniq").on(t.establishmentId) }));

export const connectAccounts = pgTable("connect_accounts", {
  establishmentId: uuid("establishment_id").primaryKey().references(() => establishments.id, { onDelete: "cascade" }),
  stripeAccountId: text("stripe_account_id").notNull(),
  chargesEnabled: text("charges_enabled").notNull().default("false"),
  payoutsEnabled: text("payouts_enabled").notNull().default("false"),
  ...stamps,
});

export const commissions = pgTable("commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  establishmentId: uuid("establishment_id").notNull().references(() => establishments.id, { onDelete: "cascade" }),
  routeId: uuid("route_id").references(() => routes.id, { onDelete: "set null" }),
  grossCents: integer("gross_cents").notNull(),
  commissionPct: numeric("commission_pct", { precision: 5, scale: 2 }).notNull(),
  commissionCents: integer("commission_cents").notNull(),
  stripeTransferId: text("stripe_transfer_id"),
  ...stamps,
}, (t) => ({ estIdx: index("commissions_est_idx").on(t.establishmentId) }));

export const stripeEvents = pgTable("stripe_events", {
  eventId: text("event_id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});
