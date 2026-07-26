import { NextResponse } from "next/server";
import { processSubscriptionRenewals } from "@/server/repositories/payments";

/** Cron MRR billing — protect with CRON_SECRET in production */
export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processSubscriptionRenewals();
  const renewed = results.filter((r) => r.status === "renewed").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({
    processed: results.length,
    renewed,
    failed,
    results,
  });
}
