import { NextResponse } from "next/server";
import { runAssistant } from "@/modules/ai/assistant-service";
import { checkRateLimit } from "@/modules/ai/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rate = checkRateLimit(`search:${ip}`);

  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { query } = await request.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const result = await runAssistant(query, { locale });

  return NextResponse.json({
    filters: result.filters,
    assumptions: result.assumptions,
    missing: result.missing,
    reply: result.reply,
    listings: result.listings,
    citations: result.citations,
    mode: result.mode,
    note:
      result.mode === "openai"
        ? "Assistant DarBladi — OpenAI"
        : "Mode démonstration — parseur local DarBladi (définir OPENAI_API_KEY + AI_PROVIDER=openai pour le LLM)",
  });
}
