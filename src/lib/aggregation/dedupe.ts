import type { AggregatedListing } from "./types";

/** Déduplication — priorité first_party > partner_contract > licensed_api */
const LICENSE_PRIORITY: Record<string, number> = {
  first_party: 4,
  partner_contract: 3,
  licensed_api: 2,
  pending: 1,
  disabled: 0,
};

function listingKey(l: AggregatedListing): string {
  if (l.externalId && l.aggregationSource) {
    return `${l.aggregationSource}:${l.externalId}`;
  }
  return l.slug;
}

function fuzzyDuplicate(a: AggregatedListing, b: AggregatedListing): boolean {
  if (a.aggregationSource === b.aggregationSource) return false;
  if (a.location.city.toLowerCase() !== b.location.city.toLowerCase()) return false;
  if (Math.abs(a.price - b.price) / Math.max(a.price, 1) > 0.02) return false;
  if (a.livingArea && b.livingArea && Math.abs(a.livingArea - b.livingArea) > 5) return false;
  const ta = a.title.toLowerCase().slice(0, 40);
  const tb = b.title.toLowerCase().slice(0, 40);
  return ta === tb || ta.includes(tb.slice(0, 20)) || tb.includes(ta.slice(0, 20));
}

export function dedupeAggregatedListings(listings: AggregatedListing[]): AggregatedListing[] {
  const byKey = new Map<string, AggregatedListing>();

  for (const listing of listings) {
    const key = listingKey(listing);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, listing);
      continue;
    }
    const keep =
      (LICENSE_PRIORITY[listing.licenseStatus] ?? 0) >=
      (LICENSE_PRIORITY[existing.licenseStatus] ?? 0)
        ? listing
        : existing;
    byKey.set(key, keep);
  }

  const unique = Array.from(byKey.values());
  const removed = new Set<number>();

  for (let i = 0; i < unique.length; i++) {
    if (removed.has(i)) continue;
    for (let j = i + 1; j < unique.length; j++) {
      if (removed.has(j)) continue;
      if (fuzzyDuplicate(unique[i], unique[j])) {
        const keep =
          (LICENSE_PRIORITY[unique[i].licenseStatus] ?? 0) >=
          (LICENSE_PRIORITY[unique[j].licenseStatus] ?? 0)
            ? i
            : j;
        removed.add(keep === i ? j : i);
      }
    }
  }

  return unique.filter((_, idx) => !removed.has(idx));
}
