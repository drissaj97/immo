#!/usr/bin/env tsx
/**
 * Seed PostgreSQL when DATABASE_URL is configured.
 * Without DB, the app uses in-memory demo data from src/lib/data/demo-data.ts
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { DEMO_LISTINGS, DEMO_LOCATIONS, EXCHANGE_RATES } from "../src/lib/data/demo-data";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — seed skipped. App uses in-memory demo data.");
    process.exit(0);
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding locations...");
  for (const loc of DEMO_LOCATIONS) {
    await db
      .insert(schema.locations)
      .values({
        id: loc.id as unknown as undefined,
        city: loc.city,
        neighborhood: loc.neighborhood,
        region: loc.region,
        slug: loc.slug,
        latitude: String(loc.latitude),
        longitude: String(loc.longitude),
      })
      .onConflictDoNothing();
  }

  console.log("Seeding listings...");
  for (const listing of DEMO_LISTINGS) {
    await db
      .insert(schema.listings)
      .values({
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        transactionType: listing.transactionType,
        listingType: listing.listingType,
        status: listing.status,
        price: listing.price,
        currency: listing.currency,
        livingArea: listing.livingArea,
        landArea: listing.landArea,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        hasPool: listing.hasPool,
        hasParking: listing.hasParking,
        hasGarden: listing.hasGarden,
        hasTerrace: listing.hasTerrace,
        isFurnished: listing.isFurnished,
        hasTitleDeed: listing.hasTitleDeed,
        isNew: listing.isNew,
        latitude: String(listing.latitude),
        longitude: String(listing.longitude),
        reference: listing.reference,
        sourceType: listing.sourceType,
        sourceName: listing.sourceName,
        completenessScore: listing.completenessScore,
        freshnessScore: listing.freshnessScore,
        isVerified: listing.isVerified,
        isDemo: true,
        publishedAt: new Date(listing.publishedAt),
      })
      .onConflictDoNothing();
  }

  console.log("Seeding exchange rates...");
  await db.insert(schema.exchangeRates).values([
    { fromCurrency: "MAD", toCurrency: "EUR", rate: String(EXCHANGE_RATES.EUR), source: EXCHANGE_RATES.source, rateDate: new Date(EXCHANGE_RATES.date) },
    { fromCurrency: "MAD", toCurrency: "USD", rate: String(EXCHANGE_RATES.USD), source: EXCHANGE_RATES.source, rateDate: new Date(EXCHANGE_RATES.date) },
  ]).onConflictDoNothing();

  await client.end();
  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
