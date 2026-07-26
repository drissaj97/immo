import { NextResponse } from "next/server";
import { getAffiliateByCode, getDefaultAffiliateCodes } from "@/lib/data/affiliates";
import { getReferralStats, listReferrals, trackReferral } from "@/server/repositories/affiliates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const stats = getReferralStats(code);
    const referrals = listReferrals(code);
    return NextResponse.json({ code, stats, referrals: referrals.slice(0, 20) });
  }
  return NextResponse.json({ codes: getDefaultAffiliateCodes() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const code = body.code as string;
  if (!getAffiliateByCode(code)) {
    return NextResponse.json({ error: "Invalid affiliate code" }, { status: 400 });
  }

  const record = trackReferral({
    affiliateCode: code,
    event: body.event ?? "visit",
    visitorId: body.visitorId,
    userId: body.userId,
    metadata: body.metadata,
  });

  return NextResponse.json({ ok: true, record });
}
