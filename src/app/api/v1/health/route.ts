import { NextResponse } from "next/server";
import { authenticatePartner, getPublicApiVersion } from "@/lib/api/partner-auth";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: getPublicApiVersion(),
    demo: process.env.DEMO_MODE !== "false",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const partner = authenticatePartner(request);
  if (!partner) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }
  return NextResponse.json({ status: "authenticated", partner: partner.partnerName });
}
