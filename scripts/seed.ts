#!/usr/bin/env tsx
/**
 * Seed PostgreSQL when DATABASE_URL is configured.
 * Without DB, the app uses in-memory demo data from src/lib/data/demo-data.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { DEMO_LISTINGS, DEMO_LOCATIONS, DEMO_USERS, EXCHANGE_RATES } from "../src/lib/data/demo-data";
import {
  DEMO_ORGANIZATIONS,
  DEMO_PROJECTS,
  DEMO_PROFESSIONALS,
} from "../src/lib/data/marketplace-data";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — seed skipped. App uses in-memory demo data.");
    process.exit(0);
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding users...");
  for (const user of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const [inserted] = await db
      .insert(schema.users)
      .values({
        email: user.email,
        passwordHash,
        role: user.role,
        locale: "fr",
        currency: "MAD",
      })
      .onConflictDoNothing()
      .returning();

    const dbUser =
      inserted ??
      (await db.select().from(schema.users).where(eq(schema.users.email, user.email)).limit(1))[0];

    if (dbUser) {
      await db
        .insert(schema.profiles)
        .values({
          userId: dbUser.id,
          fullName: user.fullName,
          isDemo: true,
        })
        .onConflictDoNothing();
    }
  }

  console.log("Seeding locations...");
  const locationIdBySlug = new Map<string, string>();
  for (const loc of DEMO_LOCATIONS) {
    const [row] = await db
      .insert(schema.locations)
      .values({
        city: loc.city,
        neighborhood: loc.neighborhood,
        region: loc.region,
        slug: loc.slug,
        latitude: String(loc.latitude),
        longitude: String(loc.longitude),
      })
      .onConflictDoUpdate({
        target: schema.locations.slug,
        set: { city: loc.city, neighborhood: loc.neighborhood },
      })
      .returning();
    if (row) locationIdBySlug.set(loc.slug, row.id);
  }

  console.log("Seeding listings...");
  for (const listing of DEMO_LISTINGS) {
    const locationId = locationIdBySlug.get(listing.location.slug);
    const [inserted] = await db
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
        locationId,
        latitude: String(listing.latitude),
        longitude: String(listing.longitude),
        reference: listing.reference,
        externalId: listing.id,
        sourceType: listing.sourceType,
        sourceName: listing.sourceName,
        completenessScore: listing.completenessScore,
        freshnessScore: listing.freshnessScore,
        isVerified: listing.isVerified,
        isDemo: true,
        publishedAt: new Date(listing.publishedAt),
      })
      .onConflictDoUpdate({
        target: schema.listings.slug,
        set: { title: listing.title, price: listing.price, status: listing.status },
      })
      .returning();

    const dbListing =
      inserted ??
      (await db.select().from(schema.listings).where(eq(schema.listings.slug, listing.slug)).limit(1))[0];

    if (dbListing && listing.images.length > 0) {
      for (const [i, url] of listing.images.entries()) {
        await db.insert(schema.listingMedia).values({
          listingId: dbListing.id,
          url,
          sortOrder: i,
          isDemo: true,
        });
      }
    }
  }

  console.log("Seeding organizations...");
  const orgIdBySlug = new Map<string, string>();
  for (const org of DEMO_ORGANIZATIONS) {
    const [row] = await db
      .insert(schema.organizations)
      .values({
        name: org.name,
        slug: org.slug,
        type: org.type,
        description: org.description,
        isVerified: org.isVerified,
        isDemo: true,
      })
      .onConflictDoUpdate({
        target: schema.organizations.slug,
        set: { name: org.name, description: org.description },
      })
      .returning();
    if (row) orgIdBySlug.set(org.slug, row.id);
  }

  console.log("Seeding projects...");
  for (const project of DEMO_PROJECTS) {
    const orgSlug = DEMO_ORGANIZATIONS.find((o) => o.id === project.organizationId)?.slug;
    await db
      .insert(schema.projects)
      .values({
        organizationId: orgSlug ? orgIdBySlug.get(orgSlug) : undefined,
        slug: project.slug,
        name: project.name,
        description: project.description,
        city: project.city,
        neighborhood: project.neighborhood,
        status: project.status,
        deliveryDate: project.deliveryDate ? new Date(project.deliveryDate) : null,
        isDemo: true,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding professionals...");
  for (const pro of DEMO_PROFESSIONALS) {
    const orgSlug = DEMO_ORGANIZATIONS.find((o) => o.id === pro.organizationId)?.slug;
    await db
      .insert(schema.professionalProfiles)
      .values({
        slug: pro.slug,
        displayName: pro.displayName,
        bio: pro.bio,
        city: pro.city,
        organizationId: orgSlug ? orgIdBySlug.get(orgSlug) : undefined,
        isVerified: pro.isVerified,
        isDemo: true,
      })
      .onConflictDoNothing();
  }

  console.log("Seeding exchange rates...");
  await db.insert(schema.exchangeRates).values([
    { fromCurrency: "MAD", toCurrency: "EUR", rate: String(EXCHANGE_RATES.EUR), source: EXCHANGE_RATES.source, rateDate: new Date(EXCHANGE_RATES.date) },
    { fromCurrency: "MAD", toCurrency: "USD", rate: String(EXCHANGE_RATES.USD), source: EXCHANGE_RATES.source, rateDate: new Date(EXCHANGE_RATES.date) },
  ]);

  console.log("Seeding demo leads...");
  await db.insert(schema.leads).values([
    {
      contactName: "Karim B.",
      contactEmail: "karim.demo@example.com",
      contactPhone: "+212 6 00 00 00 01",
      message: "Intéressé par une visite cette semaine.",
      status: "new",
      source: "website",
      isDemo: true,
    },
    {
      contactName: "Sophie L.",
      contactEmail: "sophie.demo@example.com",
      message: "Demande d'informations sur la fiscalité.",
      status: "contacted",
      source: "darbladi",
      isDemo: true,
    },
  ]);

  await client.end();
  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
