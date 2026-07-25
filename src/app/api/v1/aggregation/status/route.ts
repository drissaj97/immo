import { NextResponse } from "next/server";
import { getAggregationStats } from "@/lib/aggregation/sync";

export async function GET() {
  const stats = await getAggregationStats();
  return NextResponse.json(stats);
}
