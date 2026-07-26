import { NextResponse } from "next/server";
import { authenticatePartner } from "@/lib/api/partner-auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { getListingById } from "@/server/repositories/listings";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const partner = authenticatePartner(request);
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit(`partner:${partner.keyId}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing || listing.status !== "published") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      data: {
        id: listing.id,
        slug: listing.slug,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        currency: listing.currency,
        transactionType: listing.transactionType,
        listingType: listing.listingType,
        city: listing.location.city,
        neighborhood: listing.location.neighborhood,
        livingArea: listing.livingArea,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        images: listing.images,
        isVerified: listing.isVerified,
        isDemo: listing.isDemo,
        sourceName: listing.sourceName,
        reference: listing.reference,
      },
      meta: { partner: partner.partnerName },
    },
    { headers: rateLimitHeaders(rl) },
  );
}
