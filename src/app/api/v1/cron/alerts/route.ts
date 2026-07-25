import { NextResponse } from "next/server";
import { sendAlertEmail } from "@/lib/email/provider";
import { sendPushToUser } from "@/lib/push/provider";
import { searchListings } from "@/server/repositories/listings";
import { listSavedSearches } from "@/server/repositories/saved-searches";

/** Cron — email + push alerts; protect with CRON_SECRET in production */
export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed: string[] = [];
  const pushSent: number[] = [];
  const demoUserId = "user-buyer";
  const searches = await listSavedSearches(demoUserId);
  for (const search of searches.filter((s) => s.alertEnabled)) {
    const { total } = await searchListings(search.filters);
    await sendAlertEmail("acheteur@darbladi.demo", search.name, total);
    const pushes = await sendPushToUser(
      demoUserId,
      "DarBladi — Alerte recherche",
      `${total} bien(s) pour « ${search.name} »`,
      { searchId: search.id },
    );
    pushSent.push(pushes);
    processed.push(search.id);
  }

  return NextResponse.json({
    processed: processed.length,
    ids: processed,
    pushNotifications: pushSent.reduce((a, b) => a + b, 0),
  });
}
