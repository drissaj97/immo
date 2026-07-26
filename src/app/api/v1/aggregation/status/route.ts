import { NextResponse } from "next/server";
import { getAggregationStats } from "@/lib/aggregation/sync";
import { canAccessAdminTools } from "@/lib/auth/admin-access";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await canAccessAdminTools({
    key: url.searchParams.get("key"),
    request,
  });
  if (!access.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getAggregationStats();
  return NextResponse.json(stats);
}
