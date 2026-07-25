import { NextResponse } from "next/server";
import { runAssistant } from "@/modules/ai/assistant-service";
import { checkRateLimit } from "@/modules/ai/rate-limit";
import type { LLMMessage } from "@/modules/ai/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const rate = checkRateLimit(`darbladi:${ip}`);

  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const message = body.message as string;
  const history = (body.history ?? []) as LLMMessage[];

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const result = await runAssistant(message, { locale }, history);

  return NextResponse.json({
    ...result,
    remaining: rate.remaining,
  });
}
