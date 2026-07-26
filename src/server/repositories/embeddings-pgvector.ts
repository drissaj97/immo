/** pgvector search — uses PostgreSQL when available, falls back to in-memory cosine. */

import { searchByEmbedding, type EmbeddingDocument } from "@/modules/ai/embeddings";

export type VectorSearchResult = EmbeddingDocument & { score: number };

export async function searchVectors(
  queryEmbedding: number[],
  documents: EmbeddingDocument[],
  limit = 5,
): Promise<VectorSearchResult[]> {
  if (process.env.DATABASE_URL && process.env.EMBEDDING_PROVIDER === "openai") {
    const pgResults = await searchPgVector(queryEmbedding, limit);
    if (pgResults.length > 0) return pgResults;
  }

  return documents
    .map((d) => ({ ...d, score: cosineSimilarity(queryEmbedding, d.embedding) }))
    .filter((d) => d.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) dot += a[i] * b[i];
  return dot;
}

async function searchPgVector(
  queryEmbedding: number[],
  limit: number,
): Promise<VectorSearchResult[]> {
  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

    const vectorStr = `[${queryEmbedding.join(",")}]`;
    const rows = await sql`
      SELECT listing_id::text AS id, content AS text, metadata,
             1 - (embedding <=> ${vectorStr}::vector) AS score
      FROM listing_embeddings
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;

    await sql.end();

    return rows.map((r) => ({
      id: r.id as string,
      text: r.text as string,
      embedding: queryEmbedding,
      metadata: (r.metadata as Record<string, string>) ?? {},
      score: Number(r.score),
    }));
  } catch (err) {
    console.warn("[pgvector] search fallback to in-memory:", err);
    return [];
  }
}

export function getVectorSearchMode(): "pgvector" | "in-memory" {
  if (process.env.DATABASE_URL && process.env.EMBEDDING_PROVIDER === "openai") {
    return "pgvector";
  }
  return "in-memory";
}
