/** Mock embedding service — deterministic vectors for demo RAG.
 *  Production: OpenAI text-embedding-3-small + pgvector cosine search. */

const DIM = 64;

function hashToken(token: string): number {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (h * 31 + token.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function embedText(text: string): number[] {
  const tokens = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,.-]+/)
    .filter((t) => t.length > 2);

  const vec = new Array(DIM).fill(0) as number[];
  for (const token of tokens) {
    const h = hashToken(token);
    vec[h % DIM] += 1;
    vec[(h >> 8) % DIM] += 0.5;
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) dot += a[i] * b[i];
  return dot;
}

export type EmbeddingDocument = {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, string>;
};

export function buildEmbeddingDocuments(
  items: Array<{ id: string; text: string; metadata: Record<string, string> }>,
): EmbeddingDocument[] {
  return items.map((item) => ({
    ...item,
    embedding: embedText(item.text),
  }));
}

export function searchByEmbedding(
  query: string,
  documents: EmbeddingDocument[],
  limit = 5,
): Array<EmbeddingDocument & { score: number }> {
  const q = embedText(query);
  return documents
    .map((doc) => ({ ...doc, score: cosineSimilarity(q, doc.embedding) }))
    .filter((d) => d.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
