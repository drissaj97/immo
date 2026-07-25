import { NextResponse } from "next/server";
import { authenticatePartner } from "@/lib/api/partner-auth";
import { checkRateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { DEMO_MARKET_METRICS } from "@/lib/data/market-data";

export async function GET(request: Request) {
  const partner = authenticatePartner(request);
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit(`partner:${partner.keyId}`);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  const metrics = city
    ? DEMO_MARKET_METRICS.filter((m) => m.city.toLowerCase() === city.toLowerCase())
    : DEMO_MARKET_METRICS;

  return NextResponse.json(
    {
      data: metrics,
      meta: {
        count: metrics.length,
        partner: partner.partnerName,
        disclaimer: "Métriques indicatives fictives — ne constituent pas un conseil d'investissement.",
      },
    },
    { headers: rateLimitHeaders(rl) },
  );
}
