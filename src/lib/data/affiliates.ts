export type AffiliateProfile = {
  code: string;
  agentName: string;
  agentId: string;
  commissionRate: number;
  isActive: boolean;
};

export const AFFILIATE_PROFILES: AffiliateProfile[] = [
  { code: "YASMINE2026", agentName: "Yasmine El Amrani", agentId: "pro-yasmine-el-amrani", commissionRate: 0.03, isActive: true },
  { code: "OMARPRO", agentName: "Omar Benjelloun", agentId: "pro-omar-benjelloun", commissionRate: 0.025, isActive: true },
  { code: "DARBLADI10", agentName: "DarBladi Promo", agentId: "org-atlas-premium", commissionRate: 0.02, isActive: true },
];

export function getAffiliateByCode(code: string): AffiliateProfile | undefined {
  return AFFILIATE_PROFILES.find((a) => a.code.toUpperCase() === code.toUpperCase() && a.isActive);
}

export function getDefaultAffiliateCodes(): string[] {
  return AFFILIATE_PROFILES.map((a) => a.code);
}
