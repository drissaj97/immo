import { NextResponse } from "next/server";
import { syncAggregatedCatalog } from "@/lib/aggregation/sync";

/** Cron agrégation — sync toutes les sources activées */
export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listings, results } = await syncAggregatedCatalog();

  return NextResponse.json({
    total: listings.length,
    published: listings.filter((l) => l.status === "published").length,
    results,
    syncedAt: new Date().toISOString(),
  });
}
