/** Normalisation accents/casse pour comparaison villes et quartiers. */
export function normalizeLocationKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function cityMatches(
  filterCity: string,
  listingOrCity: string | { location: { city: string; neighborhood: string } },
): boolean {
  const listingCity =
    typeof listingOrCity === "string" ? listingOrCity : listingOrCity.location.city;
  const neighborhood =
    typeof listingOrCity === "string" ? "" : listingOrCity.location.neighborhood;

  if (normalizeLocationKey(filterCity) === normalizeLocationKey(listingCity)) return true;
  if (neighborhood && normalizeLocationKey(filterCity) === normalizeLocationKey(neighborhood)) {
    return true;
  }
  return false;
}

function tokenizeLocation(value: string): string[] {
  return normalizeLocationKey(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

function tokensMatch(filterTokens: string[], candidateTokens: string[]): boolean {
  if (filterTokens.length === 0) return false;
  return filterTokens.every((token) =>
    candidateTokens.some((candidate) => candidate === token || candidate.includes(token)),
  );
}

export function neighborhoodMatches(
  filterNeighborhood: string,
  listing: { location: { neighborhood: string; city: string }; title: string; description: string },
): boolean {
  const key = normalizeLocationKey(filterNeighborhood);
  if (!key) return true;

  const hood = normalizeLocationKey(listing.location.neighborhood);
  if (hood === key) return true;

  const filterTokens = tokenizeLocation(filterNeighborhood);
  const hoodTokens = tokenizeLocation(listing.location.neighborhood);
  if (tokensMatch(filterTokens, hoodTokens)) return true;

  const haystack = normalizeLocationKey(
    `${listing.location.neighborhood} ${listing.title} ${listing.description}`,
  );
  return filterTokens.length > 0 && filterTokens.every((token) => haystack.includes(token));
}
