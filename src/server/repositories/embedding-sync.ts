import type { DemoListing } from "@/lib/data/demo-data";
import { listingEmbeddingText } from "@/lib/aggregation/listing-embedding-text";
import { createEmbeddingProvider } from "@/modules/ai/embeddings-provider";

/** Indexe ou met à jour l'embedding pgvector d'une annonce publiée. */
export async function syncListingEmbedding(listing: DemoListing): Promise<boolean> {
  if (!process.env.DATABASE_URL || !process.env.OPENAI_API_KEY) return false;
  if (listing.status !== "published" || listing.isDemo) return false;

  try {
    const provider = createEmbeddingProvider();
    const text = listingEmbeddingText(listing);
    const [embedding] = await provider.embedBatch([text]);
    const vectorStr = `[${embedding.join(",")}]`;

    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

    await sql`
      DELETE FROM listing_embeddings
      WHERE content = ${text} AND is_demo = false
    `;

    await sql`
      INSERT INTO listing_embeddings (content, embedding, is_demo)
      VALUES (
        ${text},
        ${vectorStr}::vector,
        false
      )
    `;

    await sql.end();
    return true;
  } catch (err) {
    console.warn("[embedding-sync] Failed for", listing.slug, err);
    return false;
  }
}

/** Réindexe tout le catalogue statique agrégé (Holding + SEMSAR AI). */
export async function syncCatalogEmbeddings(listings: DemoListing[]): Promise<number> {
  let synced = 0;
  for (const listing of listings) {
    if (await syncListingEmbedding(listing)) synced += 1;
  }
  return synced;
}
