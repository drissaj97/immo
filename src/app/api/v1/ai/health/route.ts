import { NextResponse } from "next/server";
import { checkOpenAIHealth } from "@/modules/ai/llm-provider";
import { createEmbeddingProvider } from "@/modules/ai/embeddings-provider";
import { getListingCatalogStats } from "@/lib/data/catalog";

export async function GET() {
  const openai = await checkOpenAIHealth();
  const embeddings = createEmbeddingProvider();
  const catalog = getListingCatalogStats();

  return NextResponse.json({
    openai,
    embeddings: {
      provider: embeddings.name,
      dimensions: embeddings.dimensions,
    },
    catalog,
    fallbackEnabled: process.env.AI_FALLBACK_ON_QUOTA !== "false",
  });
}
