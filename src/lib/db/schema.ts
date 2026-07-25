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
  (table) => [index("favorites_user_idx").on(table.userId)],
);

export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromCurrency: currencyEnum("from_currency").notNull(),
  toCurrency: currencyEnum("to_currency").notNull(),
  rate: decimal("rate", { precision: 12, scale: 6 }).notNull(),
  source: varchar("source", { length: 128 }).notNull(),
  rateDate: timestamp("rate_date", { withTimezone: true }).notNull(),
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

export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Location = typeof locations.$inferSelect;
