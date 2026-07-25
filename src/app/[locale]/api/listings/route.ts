import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addDraftListing } from "@/server/repositories/listings";
import { slugify } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user || !["agent", "admin", "agency_admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = body.title as string;
  const slug = slugify(title);

  addDraftListing({
    id: uuidv4(),
    slug,
    title,
    description: body.description as string,
    transactionType: body.transactionType as "sale" | "long_term_rent",
    listingType: body.listingType as "apartment" | "villa" | "land",
    status: "pending_review",
    price: Number(body.price),
    currency: "MAD",
    livingArea: body.livingArea ? Number(body.livingArea) : undefined,
    bedrooms: body.bedrooms ? Number(body.bedrooms) : undefined,
    location: {
      id: uuidv4(),
      city: body.city as string,
      neighborhood: body.neighborhood as string,
      region: "Maroc",
      slug: slugify(`${body.city}-${body.neighborhood}`),
      latitude: 33.5,
      longitude: -7.5,
    },
    latitude: 33.5,
    longitude: -7.5,
    reference: `SA-${Date.now().toString(36).toUpperCase()}`,
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"],
    sourceType: "first_party",
    sourceName: user.fullName,
    completenessScore: 65,
    freshnessScore: 100,
    isVerified: false,
    isDemo: true,
    publishedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
