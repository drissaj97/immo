import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sendAlertEmail } from "@/lib/email/provider";
import { searchListings } from "@/server/repositories/listings";
import { createSavedSearch, deleteSavedSearch, listSavedSearches } from "@/server/repositories/saved-searches";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const searches = await listSavedSearches(user.id);
  return NextResponse.json({ searches });
}

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const search = await createSavedSearch(
    user.id,
    body.name ?? "Ma recherche",
    body.filters ?? {},
    body.alertEnabled ?? false,
  );

  if (body.alertEnabled) {
    const { total } = await searchListings(body.filters ?? {});
    void sendAlertEmail(user.email, search.name, total);
  }

  return NextResponse.json(search, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const ok = await deleteSavedSearch(user.id, id);
  return NextResponse.json({ ok });
}
