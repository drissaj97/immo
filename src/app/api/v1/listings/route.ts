import { NextResponse } from "next/server";
import { authenticatePartner } from "@/lib/api/partner-auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { searchListings } from "@/server/repositories/listings";

export async function GET(request: Request) {
  const partner = authenticatePartner(request);
  if (!partner) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Provide X-API-Key or Authorization: Bearer header" },
      { status: 401 },
    );
  }

  const rl = checkRateLimit(`partner:${partner.keyId}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  const { searchParams } = new URL(request.url);
  const filters = {
    city: searchParams.get("city") ?? undefined,
    neighborhood: searchParams.get("neighborhood") ?? undefined,
    transactionType: searchParams.get("transactionType") as "sale" | "long_term_rent" | undefined,
    listingType: searchParams.get("listingType") as "apartment" | "villa" | undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: Math.min(Number(searchParams.get("limit") ?? 20), 50),
  };

  const result = await searchListings(filters);

  const items = result.items.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    price: l.price,
    currency: l.currency,
    transactionType: l.transactionType,
    listingType: l.listingType,
    city: l.location.city,
    neighborhood: l.location.neighborhood,
    livingArea: l.livingArea,
    bedrooms: l.bedrooms,
    isVerified: l.isVerified,
    isDemo: l.isDemo,
    sourceName: l.sourceName,
    publishedAt: l.publishedAt,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/fr/biens/${l.slug}`,
  }));

  return NextResponse.json(
    {
      data: items,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        partner: partner.partnerName,
        disclaimer: "Données de démonstration — usage partenaire soumis aux CGU DarBladi.",
      },
    },
    { headers: rateLimitHeaders(rl) },
  );
}
