import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listFavoriteIds, toggleFavorite } from "@/server/repositories/favorites";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ids = await listFavoriteIds(user.id);
  return NextResponse.json({ favorites: ids });
}

export async function POST(request: Request) {
  const user = await getSession();
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
