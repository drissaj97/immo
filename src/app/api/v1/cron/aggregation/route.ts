import { NextResponse } from "next/server";
import { resetAggregationCache, syncAggregatedCatalog } from "@/lib/aggregation/sync";
import { getStaticCatalogListings } from "@/lib/aggregation/catalog";
import { syncCatalogEmbeddings } from "@/server/repositories/embedding-sync";

/** Cron agrégation — sync toutes les sources activées + réindex embeddings */
export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  resetAggregationCache();
  const { listings, results } = await syncAggregatedCatalog();

  let embeddingsSynced = 0;
  if (process.env.OPENAI_API_KEY && process.env.DATABASE_URL) {
    embeddingsSynced = await syncCatalogEmbeddings(getStaticCatalogListings());
  }

  return NextResponse.json({
    total: listings.length,
    published: listings.filter((l) => l.status === "published").length,
    embeddingsSynced,
    results,
    syncedAt: new Date().toISOString(),
  });
}
