import { NextResponse } from "next/server";
import { parseNaturalLanguageQuery } from "@/modules/search/natural-language-parser";

export async function POST(request: Request) {
  const { query } = await request.json();
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const hasAiKey = Boolean(process.env.OPENAI_API_KEY);
  const parsed = parseNaturalLanguageQuery(query);

  return NextResponse.json({
    ...parsed,
    mode: hasAiKey ? "ai_available" : "mock",
    note: hasAiKey
      ? "Clé IA détectée — branchement LLM à activer via AI_PROVIDER=openai"
      : "Mode démonstration — parseur local sans LLM",
  });
}
