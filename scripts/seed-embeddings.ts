/**
 * Seed listing + neighborhood embeddings into PostgreSQL pgvector.
 * Requires: DATABASE_URL, OPENAI_API_KEY, EMBEDDING_PROVIDER=openai
 *
 * Usage: pnpm db:seed-embeddings
 */
import "dotenv/config";
import { config } from "dotenv";
import { getStaticCatalogListings } from "../src/lib/aggregation/catalog";
import { listingEmbeddingText } from "../src/lib/aggregation/listing-embedding-text";
import { buildCatalogNeighborhoods } from "../src/lib/aggregation/catalog-analytics";
import { createEmbeddingProvider } from "../src/modules/ai/embeddings-provider";

config({ path: ".env.local" });

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY required");
    process.exit(1);
  }

  const provider = createEmbeddingProvider();
  console.info(`[seed-embeddings] Provider: ${provider.name} (${provider.dimensions}D)`);

  const postgres = (await import("postgres")).default;
  const sql = postgres(dbUrl);

  const neighborhoodItems = buildCatalogNeighborhoods().slice(0, 300).map((k) => ({
    id: k.slug,
    text: `${k.city} ${k.neighborhood} ${k.summary} ${k.highlights.join(" ")} ${k.investmentNotes.join(" ")} ${k.tags.join(" ")}`,
    metadata: { city: k.city, neighborhood: k.neighborhood, type: "neighborhood" },
  }));

  const listingItems = getStaticCatalogListings().map((l) => ({
    id: l.id,
    text: listingEmbeddingText(l),
    metadata: { slug: l.slug, city: l.location.city, type: "listing" },
  }));

  const allItems = [...neighborhoodItems, ...listingItems];
  const texts = allItems.map((i) => i.text);
  const embeddings = await provider.embedBatch(texts);

  await sql`DELETE FROM listing_embeddings WHERE is_demo = false`;

  let inserted = 0;
  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const vec = embeddings[i];
    const vectorStr = `[${vec.join(",")}]`;
    const isListing = item.metadata.type === "listing";

    await sql`
      INSERT INTO listing_embeddings (content, embedding, is_demo)
      VALUES (
        ${item.text},
        ${vectorStr}::vector,
        ${!isListing}
      )
    `;
    inserted++;
  }

  await sql.end();
  console.info(
    `[seed-embeddings] Inserted ${inserted} embeddings (${neighborhoodItems.length} quartiers, ${listingItems.length} annonces réelles)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
