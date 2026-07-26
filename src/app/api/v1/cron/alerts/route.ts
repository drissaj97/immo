import { NextResponse } from "next/server";
import { sendAlertEmail } from "@/lib/email/provider";
import { sendPushToUser } from "@/lib/push/provider";
import { searchListings } from "@/server/repositories/listings";
import {
  listDemoUserIdsWithAlerts,
  listSavedSearches,
} from "@/server/repositories/saved-searches";

/** Cron — email + push alerts; protect with CRON_SECRET in production */
export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed: string[] = [];
  const pushSent: number[] = [];
  const userIds = new Set(["user-buyer", ...listDemoUserIdsWithAlerts()]);

  for (const userId of userIds) {
    const searches = await listSavedSearches(userId);
    for (const search of searches.filter((s) => s.alertEnabled)) {
      const { total } = await searchListings({ ...search.filters, page: 1, limit: 1 });
      await sendAlertEmail("acheteur@darbladi.demo", search.name, total);
      const pushes = await sendPushToUser(
        userId,
        "DarBladi — Alerte recherche",
        `${total} bien(s) pour « ${search.name} »`,
        { searchId: search.id },
      );
      pushSent.push(pushes);
      processed.push(search.id);
    }
  }

  return NextResponse.json({
    processed: processed.length,
    ids: processed,
    pushNotifications: pushSent.reduce((a, b) => a + b, 0),
  });
}
