export type PlanId = "free" | "investor" | "pro" | "enterprise";

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  priceMonthly: number;
  currency: "MAD";
  description: string;
  features: string[];
  targetRole: "buyer" | "agent" | "agency";
  isDemo: true;
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    priceMonthly: 0,
    currency: "MAD",
    description: "Parcourir, comparer et simuler gratuitement.",
    features: ["Catalogue complet", "Comparateur 3 biens", "Simulateur rentabilité", "Assistant Samsar IA (limité)"],
    targetRole: "buyer",
    isDemo: true,
  },
  {
    id: "investor",
    name: "Investisseur Premium",
    priceMonthly: 149,
    currency: "MAD",
    description: "Rapports illimités et alertes avancées.",
    features: ["Rapports investissement illimités", "Alertes recherche email", "Analytics sectorielles", "Export PDF"],
    targetRole: "buyer",
    isDemo: true,
  },
  {
    id: "pro",
    name: "Professionnel Pro",
    priceMonthly: 990,
    currency: "MAD",
    description: "Pour agents et agences — leads et publication.",
    features: ["Publication illimitée", "CRM leads", "Import CSV partenaires", "Badge vérifié", "3 agents inclus"],
    targetRole: "agent",
    isDemo: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 2490,
    currency: "MAD",
    description: "Promoteurs et grands comptes multi-sites.",
    features: ["Tout Pro +", "API partenaires prioritaire", "Programmes neufs", "Account manager dédié", "Agents illimités"],
    targetRole: "agency",
    isDemo: true,
  },
];

export function getPlanById(id: PlanId): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}

/** Acompte réservation : 5 % du prix, min 5 000 MAD, max 50 000 MAD */
export function calculateDepositAmount(priceMad: number): number {
  const raw = Math.round(priceMad * 0.05);
  return Math.min(50_000, Math.max(5_000, raw));
}
