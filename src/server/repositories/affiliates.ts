import { getAffiliateByCode } from "@/lib/data/affiliates";

export type ReferralRecord = {
  id: string;
  affiliateCode: string;
  agentName: string;
  visitorId?: string;
  userId?: string;
  event: "visit" | "signup" | "lead" | "deposit";
  metadata?: Record<string, string>;
  createdAt: string;
  isDemo: true;
};

const referralStore: ReferralRecord[] = [];

export function trackReferral(input: {
  affiliateCode: string;
  event: ReferralRecord["event"];
  visitorId?: string;
  userId?: string;
  metadata?: Record<string, string>;
}): ReferralRecord | null {
  const affiliate = getAffiliateByCode(input.affiliateCode);
  if (!affiliate) return null;

  const record: ReferralRecord = {
    id: `ref-${Date.now()}`,
    affiliateCode: affiliate.code,
    agentName: affiliate.agentName,
    visitorId: input.visitorId,
    userId: input.userId,
    event: input.event,
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
  referralStore.unshift(record);
  return record;
}

export function listReferrals(affiliateCode?: string): ReferralRecord[] {
  if (!affiliateCode) return [...referralStore];
  return referralStore.filter((r) => r.affiliateCode.toUpperCase() === affiliateCode.toUpperCase());
}

export function getReferralStats(affiliateCode: string) {
  const refs = listReferrals(affiliateCode);
  return {
    total: refs.length,
    visits: refs.filter((r) => r.event === "visit").length,
    signups: refs.filter((r) => r.event === "signup").length,
    leads: refs.filter((r) => r.event === "lead").length,
    deposits: refs.filter((r) => r.event === "deposit").length,
  };
}
