/** Normalisation accents/casse pour comparaison villes et quartiers. */
export function normalizeLocationKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function cityMatches(filterCity: string, listingCity: string): boolean {
  return normalizeLocationKey(filterCity) === normalizeLocationKey(listingCity);
}

export function neighborhoodMatches(
  filterNeighborhood: string,
  listing: { location: { neighborhood: string; city: string }; title: string; description: string },
): boolean {
  const key = normalizeLocationKey(filterNeighborhood);
  if (!key) return true;

  const hood = normalizeLocationKey(listing.location.neighborhood);
  if (hood === key || hood.includes(key) || key.includes(hood)) return true;

  const haystack = normalizeLocationKey(
    `${listing.location.neighborhood} ${listing.location.city} ${listing.title} ${listing.description}`,
  );
  return haystack.includes(key);
}
