import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { sendAlertEmail } from "@/lib/email/provider";
import { searchListings } from "@/server/repositories/listings";
import {
  createSavedSearch,
  deleteSavedSearch,
  listSavedSearches,
  setSavedSearchAlert,
} from "@/server/repositories/saved-searches";
import { buildSavedSearchName } from "@/lib/search/saved-search-label";
import type { SearchFilters } from "@/modules/search/natural-language-parser";

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
  const filters = (body.filters ?? {}) as SearchFilters;
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : buildSavedSearchName(filters);

  const search = await createSavedSearch(
    user.id,
    name,
    filters,
    body.alertEnabled ?? false,
  );

  if (body.alertEnabled) {
    const { total } = await searchListings({ ...filters, page: 1, limit: 1 });
    void sendAlertEmail(user.email, search.name, total);
  }

  return NextResponse.json(search, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; alertEnabled?: boolean };
  if (!body.id || typeof body.alertEnabled !== "boolean") {
    return NextResponse.json({ error: "id and alertEnabled required" }, { status: 400 });
  }

  const updated = await setSavedSearchAlert(user.id, body.id, body.alertEnabled);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
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
