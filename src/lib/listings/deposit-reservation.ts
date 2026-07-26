import type { AggregationSourceId, AggregationLicenseStatus } from "@/lib/aggregation/types";

/** Portails scrapés / agrégés — jamais d'acompte DarBladi. */
const NO_DEPOSIT_SOURCES = new Set<string>([
  "avito",
  "mubawab",
  "sarouty",
  "semsarai",
  "agenz",
  "yakeey",
]);

export type DepositReservationListing = {
  transactionType: string;
  status?: string;
  /** Opt-in promoteur : proposer la réservation avec acompte sur cette annonce publique. */
  depositReservationEnabled?: boolean;
  aggregationSource?: AggregationSourceId | string;
  sourceType?: string;
  licenseStatus?: AggregationLicenseStatus | string;
  isExternal?: boolean;
};

/**
 * Acompte réservation uniquement pour les annonces de promoteurs / first-party
 * qui ont explicitement demandé la mise en ligne publique avec acompte.
 * Jamais sur Avito, Mubawab, Sarouty, etc.
 */
export function listingAllowsDepositReservation(listing: DepositReservationListing): boolean {
  if (listing.transactionType !== "sale") return false;
  if (listing.status && listing.status !== "published") return false;
  if (!listing.depositReservationEnabled) return false;

  const source = String(listing.aggregationSource ?? "");
  if (source && NO_DEPOSIT_SOURCES.has(source)) return false;

  // Sources autorisées : DarBladi first-party, holding partenaire, contrat promoteur
  const license = listing.licenseStatus ?? "";
  const sourceType = listing.sourceType ?? "";
  const isFirstParty =
    source === "darbladi" ||
    sourceType === "first_party" ||
    license === "first_party";
  const isContractedPartner =
    source === "holding-immo" ||
    license === "partner_contract" ||
    license === "licensed_api";

  // Annonce native DarBladi (pas externe scrapée)
  const isNativeDarbladi = !listing.isExternal && !NO_DEPOSIT_SOURCES.has(source);

  return isFirstParty || isContractedPartner || isNativeDarbladi;
}
