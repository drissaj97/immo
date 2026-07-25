import { NextResponse } from "next/server";
import { getListingById } from "@/server/repositories/listings";
import { createInvestmentReport } from "@/server/repositories/investment";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  await params;
  const { listingId } = await request.json();
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const listing = await getListingById(listingId);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const report = createInvestmentReport(listing);
  return NextResponse.json({ id: report.id, report });
}
