/** Embedding provider abstraction — mock (local) or OpenAI text-embedding-3-small. */

import { OpenAIQuotaError, openaiFetch } from "./openai-fetch";

export type EmbeddingProviderName = "mock" | "openai";

export interface EmbeddingProvider {
  readonly name: EmbeddingProviderName;
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = "mock" as const;
  readonly dimensions = 64;

  async embed(text: string): Promise<number[]> {
    return mockEmbed(text, this.dimensions);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((t) => mockEmbed(t, this.dimensions));
  }
}

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai" as const;
  readonly dimensions = 1536;

  async embed(text: string): Promise<number[]> {
    const [vec] = await this.embedBatch([text]);
    return vec;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY required for OpenAI embeddings");

    const res = await openaiFetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      if (res.status === 429 && err.includes("quota")) {
        console.warn("[ai:embeddings] Quota exceeded — falling back to mock embeddings");
        return texts.map((t) => mockEmbed(t, this.dimensions));
      }
      throw new Error(`OpenAI embeddings failed: ${err}`);
    }

    const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((d) => d.embedding);
  }
}

function hashToken(token: string): number {
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (h * 31 + token.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function mockEmbed(text: string, dim: number): number[] {
  const tokens = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,.-]+/)
    .filter((t) => t.length > 2);

  const vec = new Array(dim).fill(0) as number[];
  for (const token of tokens) {
    const h = hashToken(token);
    vec[h % dim] += 1;
    vec[(h >> 8) % dim] += 0.5;
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

let cachedProvider: EmbeddingProvider | null = null;

export function createEmbeddingProvider(): EmbeddingProvider {
  if (cachedProvider) return cachedProvider;

  if (process.env.EMBEDDING_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    cachedProvider = new OpenAIEmbeddingProvider();
  } else if (process.env.AI_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
    cachedProvider = new OpenAIEmbeddingProvider();
  } else {
    cachedProvider = new MockEmbeddingProvider();
  }
  return cachedProvider;
}

export function resetEmbeddingProviderCache(): void {
  cachedProvider = null;
}
