import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addDraftListing } from "@/server/repositories/listings";
import type { DemoListing } from "@/lib/data/demo-data";
import { DEMO_LOCATIONS } from "@/lib/data/demo-data";

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function rowToListing(row: CsvRow, index: number): DemoListing {
  const city = row.city || "Marrakech";
  const loc = DEMO_LOCATIONS.find((l) => l.city === city) ?? DEMO_LOCATIONS[0];
  const slug = `import-${Date.now()}-${index}-${row.title?.slice(0, 20).replace(/\s+/g, "-").toLowerCase() ?? "bien"}`;

  return {
    id: `import-${Date.now()}-${index}`,
    slug,
    title: row.title || "Annonce importée",
    description: row.description || "Import CSV partenaire — donnée fictive.",
    transactionType: (row.transactionType as DemoListing["transactionType"]) || "sale",
    listingType: (row.listingType as DemoListing["listingType"]) || "apartment",
    status: "pending_review",
    price: Number(row.price) || 0,
    currency: (row.currency as DemoListing["currency"]) || "MAD",
    livingArea: row.livingArea ? Number(row.livingArea) : undefined,
    bedrooms: row.bedrooms ? Number(row.bedrooms) : undefined,
    location: loc,
    latitude: loc.latitude,
    longitude: loc.longitude,
    reference: row.reference || `IMP-${index + 1}`,
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"],
    sourceType: "partner_import",
    sourceName: row.sourceName || "Import partenaire",
    completenessScore: 60,
    freshnessScore: 100,
    isVerified: false,
    isDemo: true,
    publishedAt: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user || !["admin", "agent", "agency_admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let csvText = "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    csvText = body.csv ?? "";
  } else {
    csvText = await request.text();
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV vide ou invalide" }, { status: 400 });
  }

  const imported = rows.slice(0, 50).map((row, i) => {
    const listing = rowToListing(row, i);
    addDraftListing(listing);
    return { id: listing.id, slug: listing.slug, title: listing.title };
  });

  return NextResponse.json({ imported: imported.length, listings: imported });
}
