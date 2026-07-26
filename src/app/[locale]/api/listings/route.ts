import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { submitDarbladiListing } from "@/server/repositories/listings";
import { sanitizeListingImages } from "@/lib/media/listing-images";

/**
 * Dépôt d'annonce first-party DarBladi (style SemsarAI DepotAnnonce).
 * - Public / agent : pending_review
 * - Admin : publication immédiate possible via publishNow
 */
export async function POST(request: Request) {
  const user = await getSession();
  const body = await request.json();

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const city = String(body.city ?? "").trim();
  const neighborhood = String(body.neighborhood ?? "").trim();
  const price = Number(body.price);
  const transactionType = body.transactionType === "long_term_rent" ? "long_term_rent" : "sale";
  const listingType = (["apartment", "villa", "riad", "land", "commercial"] as const).includes(
    body.listingType,
  )
    ? (body.listingType as "apartment" | "villa" | "riad" | "land" | "commercial")
    : "apartment";

  if (!title || !description || !city || !neighborhood || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json(
      { error: "Champs obligatoires : titre, description, ville, quartier, prix." },
      { status: 400 },
    );
  }

  const contactEmail = String(body.contactEmail ?? user?.email ?? "").trim();
  const contactName = String(body.contactName ?? user?.fullName ?? "").trim();
  const contactPhone = String(body.contactPhone ?? "").trim();

  // Dépôt public autorisé (comme SemsarAI) — sinon agent/admin connecté
  const isStaff = user && ["agent", "admin", "agency_admin"].includes(user.role);
  if (!isStaff && !contactEmail) {
    return NextResponse.json(
      { error: "Email de contact requis pour déposer une annonce." },
      { status: 400 },
    );
  }

  const images = sanitizeListingImages([
    ...(Array.isArray(body.images) ? body.images.map(String) : []),
    body.imageUrl ? String(body.imageUrl) : "",
  ]);

  const publishNow = Boolean(body.publishNow) && user?.role === "admin";

  const listing = submitDarbladiListing({
    title,
    description,
    transactionType,
    listingType,
    price,
    city,
    neighborhood,
    region: body.region ? String(body.region) : undefined,
    livingArea: body.livingArea ? Number(body.livingArea) : undefined,
    bedrooms: body.bedrooms ? Number(body.bedrooms) : undefined,
    bathrooms: body.bathrooms ? Number(body.bathrooms) : undefined,
    images,
    contactName: contactName || undefined,
    contactEmail: contactEmail || undefined,
    contactPhone: contactPhone || undefined,
    publishNow,
    advertiserName: contactName || user?.fullName,
  });

  return NextResponse.json(
    {
      ok: true,
      listing: {
        id: listing.id,
        slug: listing.slug,
        status: listing.status,
        sourceName: listing.sourceName,
        aggregationSource: listing.aggregationSource,
      },
      message:
        listing.status === "published"
          ? "Annonce DarBladi publiée."
          : "Annonce soumise — validation DarBladi sous 24–48 h.",
    },
    { status: 201 },
  );
}
