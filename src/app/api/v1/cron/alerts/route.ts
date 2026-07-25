import { NextResponse } from "next/server";
import { sendAlertEmail } from "@/lib/email/provider";
import { searchListings } from "@/server/repositories/listings";
import { listSavedSearches } from "@/server/repositories/saved-searches";

/** Cron stub — protect with CRON_SECRET in production */
export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Demo: process all saved searches with alerts (no user email in demo store — use placeholder)
  const processed: string[] = [];
  // In demo mode, saved searches are per-user in memory; cron would iterate DB users in prod
  const demoUserId = "user-buyer";
  const searches = await listSavedSearches(demoUserId);
  for (const search of searches.filter((s) => s.alertEnabled)) {
    const { total } = await searchListings(search.filters);
    await sendAlertEmail("acheteur@darbladi.demo", search.name, total);
    processed.push(search.id);
  }

  return NextResponse.json({ processed: processed.length, ids: processed });
}
