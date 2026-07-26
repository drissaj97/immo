import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { listFavoriteIds, toggleFavorite, listFavoriteListings } from "@/server/repositories/favorites";

export async function GET(request: Request) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get("detailed") === "1";
  if (detailed) {
    const listings = await listFavoriteListings(user.id);
    return NextResponse.json({
      favorites: listings.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        price: l.price,
        currency: l.currency,
        city: l.location.city,
        neighborhood: l.location.neighborhood,
      })),
    });
  }

  const ids = await listFavoriteIds(user.id);
  return NextResponse.json({ favorites: ids });
}

export async function POST(request: Request) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await request.json();
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const active = await toggleFavorite(user.id, listingId);
  return NextResponse.json({ active });
}
