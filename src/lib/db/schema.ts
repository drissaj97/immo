import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "visitor",
  "buyer",
  "investor",
  "agent",
  "agency_admin",
  "developer",
  "admin",
]);

export const listingTypeEnum = pgEnum("listing_type", [
  "apartment",
  "villa",
  "riad",
  "land",
  "commercial",
  "office",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "sale",
  "long_term_rent",
  "seasonal_rent",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "pending_review",
  "published",
  "archived",
  "rejected",
]);

export const currencyEnum = pgEnum("currency", ["MAD", "EUR", "USD"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("buyer"),
  locale: varchar("locale", { length: 5 }).default("fr"),
  currency: currencyEnum("currency").default("MAD"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  isVerified: boolean("is_verified").default(false),
  isDemo: boolean("is_demo").default(false),
});

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    country: varchar("country", { length: 64 }).notNull().default("Maroc"),
    region: varchar("region", { length: 128 }),
    city: varchar("city", { length: 128 }).notNull(),
    district: varchar("district", { length: 128 }),
    neighborhood: varchar("neighborhood", { length: 128 }),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
  },
  (table) => [index("locations_city_idx").on(table.city)],
);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 512 }).notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    transactionType: transactionTypeEnum("transaction_type").notNull(),
    listingType: listingTypeEnum("listing_type").notNull(),
    status: listingStatusEnum("status").notNull().default("draft"),
    price: integer("price").notNull(),
    currency: currencyEnum("currency").notNull().default("MAD"),
    livingArea: integer("living_area"),
    landArea: integer("land_area"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    floor: integer("floor"),
    hasElevator: boolean("has_elevator").default(false),
    hasParking: boolean("has_parking").default(false),
    hasTerrace: boolean("has_terrace").default(false),
    hasGarden: boolean("has_garden").default(false),
    hasPool: boolean("has_pool").default(false),
    isFurnished: boolean("is_furnished").default(false),
    hasTitleDeed: boolean("has_title_deed").default(false),
    isNew: boolean("is_new").default(false),
    locationId: uuid("location_id").references(() => locations.id),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    reference: varchar("reference", { length: 32 }),
    sourceType: varchar("source_type", { length: 64 }).default("first_party"),
    sourceName: varchar("source_name", { length: 128 }).default("Samsar IA Demo"),
    sourceUrl: text("source_url"),
    externalId: varchar("external_id", { length: 128 }),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    completenessScore: integer("completeness_score").default(0),
    freshnessScore: integer("freshness_score").default(0),
    isVerified: boolean("is_verified").default(false),
    isDemo: boolean("is_demo").default(true),
    ownerId: uuid("owner_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("listings_status_idx").on(table.status),
    index("listings_city_price_idx").on(table.price),
    index("listings_transaction_idx").on(table.transactionType),
  ],
);

export const listingMedia = pgTable("listing_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  sortOrder: integer("sort_order").default(0),
  isDemo: boolean("is_demo").default(true),
});

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("favorites_user_idx").on(table.userId),
    index("favorites_user_listing_idx").on(table.userId, table.listingId),
  ],
);

export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromCurrency: currencyEnum("from_currency").notNull(),
  toCurrency: currencyEnum("to_currency").notNull(),
  rate: decimal("rate", { precision: 12, scale: 6 }).notNull(),
  source: varchar("source", { length: 128 }).notNull(),
  rateDate: timestamp("rate_date", { withTimezone: true }).notNull(),
});

export const listingPriceHistory = pgTable(
  "listing_price_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    price: integer("price").notNull(),
    currency: currencyEnum("currency").notNull().default("MAD"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    event: varchar("event", { length: 32 }),
    isDemo: boolean("is_demo").default(true),
  },
  (table) => [index("price_history_listing_idx").on(table.listingId)],
);

export const marketMetrics = pgTable("market_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  city: varchar("city", { length: 128 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 128 }),
  listingType: listingTypeEnum("listing_type").notNull(),
  avgPricePerSqm: integer("avg_price_per_sqm").notNull(),
  avgRentPerSqm: integer("avg_rent_per_sqm"),
  avgYield: decimal("avg_yield", { precision: 5, scale: 2 }),
  sampleSize: integer("sample_size").default(0),
  source: varchar("source", { length: 128 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  isDemo: boolean("is_demo").default(true),
});

export const investmentScenarios = pgTable("investment_scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").references(() => listings.id),
  name: varchar("name", { length: 255 }).notNull(),
  scenario: varchar("scenario", { length: 16 }).notNull(),
  inputs: jsonb("inputs").notNull(),
  results: jsonb("results").notNull(),
  isDemo: boolean("is_demo").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const investmentReports = pgTable("investment_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  listingId: uuid("listing_id").references(() => listings.id),
  scoreOverall: integer("score_overall"),
  reportData: jsonb("report_data").notNull(),
  isDemo: boolean("is_demo").default(true),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  action: varchar("action", { length: 128 }).notNull(),
  entityType: varchar("entity_type", { length: 64 }),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const organizationTypeEnum = pgEnum("organization_type", [
  "agency",
  "developer",
  "management",
  "partner",
  "other",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  type: organizationTypeEnum("type").notNull().default("agency"),
  description: text("description"),
  logoUrl: text("logo_url"),
  isVerified: boolean("is_verified").default(false),
  isDemo: boolean("is_demo").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 64 }).notNull().default("agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("org_members_user_idx").on(table.userId)],
);

export const professionalProfiles = pgTable("professional_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  bio: text("bio"),
  phone: varchar("phone", { length: 32 }),
  city: varchar("city", { length: 128 }),
  isVerified: boolean("is_verified").default(false),
  isDemo: boolean("is_demo").default(true),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  city: varchar("city", { length: 128 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 128 }),
  status: varchar("status", { length: 32 }).default("selling"),
  deliveryDate: timestamp("delivery_date", { withTimezone: true }),
  isDemo: boolean("is_demo").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").references(() => listings.id),
    assignedToId: uuid("assigned_to_id").references(() => users.id),
    organizationId: uuid("organization_id").references(() => organizations.id),
    contactName: varchar("contact_name", { length: 255 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    message: text("message"),
    status: varchar("status", { length: 32 }).notNull().default("new"),
    source: varchar("source", { length: 64 }).default("website"),
    isDemo: boolean("is_demo").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("leads_status_idx").on(table.status)],
);

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    filters: jsonb("filters").notNull(),
    alertEnabled: boolean("alert_enabled").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("saved_searches_user_idx").on(table.userId)],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 16 }).notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    type: varchar("type", { length: 32 }).notNull(),
    amount: integer("amount").notNull(),
    currency: currencyEnum("currency").notNull().default("MAD"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    listingId: uuid("listing_id").references(() => listings.id),
    planId: varchar("plan_id", { length: 32 }),
    externalPaymentId: varchar("external_payment_id", { length: 128 }),
    provider: varchar("provider", { length: 32 }),
    isDemo: boolean("is_demo").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("payments_user_idx").on(table.userId)],
);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  renewsAt: timestamp("renews_at", { withTimezone: true }),
  isDemo: boolean("is_demo").default(true),
});

export const listingEmbeddings = pgTable("listing_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: jsonb("embedding").notNull(),
  isDemo: boolean("is_demo").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const affiliateReferrals = pgTable(
  "affiliate_referrals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    affiliateCode: varchar("affiliate_code", { length: 32 }).notNull(),
    agentName: varchar("agent_name", { length: 255 }),
    visitorId: varchar("visitor_id", { length: 128 }),
    userId: uuid("user_id").references(() => users.id),
    event: varchar("event", { length: 32 }).notNull(),
    metadata: jsonb("metadata"),
    isDemo: boolean("is_demo").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("affiliate_code_idx").on(table.affiliateCode)],
);

export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Location = typeof locations.$inferSelect;
