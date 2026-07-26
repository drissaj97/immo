/** Garantit un lien source externe absolu — jamais un chemin local /biens. */

const SOURCE_HOME: Record<string, string> = {
  "holding-immo": "https://holdingimmo.com",
  mubawab: "https://www.mubawab.ma",
  avito: "https://www.avito.ma",
  sarouty: "https://www.sarouty.ma",
  agenz: "https://www.agenz.ma",
  yakeey: "https://www.yakeey.com",
};

export function resolveExternalSourceUrl(listing: {
  sourceUrl?: string | null;
  aggregationSource?: string | null;
  sourceName?: string | null;
  externalId?: string | null;
}): string | null {
  const raw = listing.sourceUrl?.trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      // Empêche les liens qui pointent vers notre propre app
      if (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname.endsWith("darbladi.ma") ||
        url.hostname.endsWith("vercel.app")
      ) {
        return rebuildFromSource(listing, url.pathname);
      }
      return url.toString();
    } catch {
      return null;
    }
  }

  if (raw.startsWith("//")) return `https:${raw}`;

  // Chemin relatif type /biens/... → reconstruit l'URL Holding / portail
  if (raw.startsWith("/") || raw.startsWith("biens/")) {
    return rebuildFromSource(listing, raw.startsWith("/") ? raw : `/${raw}`);
  }

  if (raw.includes(".") && !raw.includes(" ")) {
    return `https://${raw.replace(/^\/+/, "")}`;
  }

  return null;
}

function rebuildFromSource(
  listing: {
    aggregationSource?: string | null;
    sourceName?: string | null;
    externalId?: string | null;
  },
  pathname: string,
): string | null {
  const source = listing.aggregationSource ?? "";
  const home = SOURCE_HOME[source];
  if (source === "holding-immo" || /holding/i.test(listing.sourceName ?? "")) {
    const path = pathname.startsWith("/biens") ? pathname : `/biens${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
    return `https://holdingimmo.com${path}`;
  }
  if (home && listing.externalId) {
    if (source === "mubawab") return `${home}/fr/a/${listing.externalId}`;
    if (source === "avito") return home;
    if (source === "sarouty") return `${home}/property-details/?listing_id=${listing.externalId}`;
  }
  return home ?? null;
}
