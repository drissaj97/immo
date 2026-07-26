import type { AggregationSourceId } from "@/lib/aggregation/types";

export type OriginalPortal = {
  /** Source technique DarBladi (badge / stats). */
  aggregationSource: AggregationSourceId;
  /** Libellé affiché — jamais « SEMSAR AI ». */
  displayName: string;
  siteKey: string;
};

const PORTALS: Array<{
  keys: RegExp;
  aggregationSource: AggregationSourceId;
  displayName: string;
  siteKey: string;
}> = [
  {
    keys: /\bmubawab\b/i,
    aggregationSource: "mubawab",
    displayName: "Mubawab.ma",
    siteKey: "mubawab",
  },
  {
    keys: /\bavito\b/i,
    aggregationSource: "avito",
    displayName: "Avito.ma",
    siteKey: "avito",
  },
  {
    keys: /\bsarouty\b/i,
    aggregationSource: "sarouty",
    displayName: "Sarouty.ma",
    siteKey: "sarouty",
  },
  {
    keys: /\bagenz\b/i,
    aggregationSource: "agenz",
    displayName: "Agenz.ma",
    siteKey: "agenz",
  },
  {
    keys: /\byakeey\b/i,
    aggregationSource: "yakeey",
    displayName: "Yakeey",
    siteKey: "yakeey",
  },
];

/** Retire le préfixe « SEMSAR AI · » et normalise le libellé portail. */
export function stripSemsaraiBrand(label: string | null | undefined): string {
  return (label ?? "")
    .replace(/^\s*SEMSAR\s*AI\s*[·\-–|:]?\s*/i, "")
    .replace(/\s*via\s*SEMSAR\s*AI\s*/i, "")
    .trim();
}

/**
 * Déduit le portail d'origine (Mubawab, Avito…) depuis site API, sourceName ou URL.
 * Ne renvoie jamais une marque Semsar AI.
 */
export function resolveOriginalPortal(input: {
  site?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
}): OriginalPortal {
  const haystack = [input.site, input.sourceName, input.sourceUrl]
    .filter(Boolean)
    .join(" ");

  for (const portal of PORTALS) {
    if (portal.keys.test(haystack)) {
      return {
        aggregationSource: portal.aggregationSource,
        displayName: portal.displayName,
        siteKey: portal.siteKey,
      };
    }
  }

  const cleaned = stripSemsaraiBrand(input.sourceName);
  if (cleaned && !/semsar/i.test(cleaned)) {
    const titled = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return {
      aggregationSource: "darbladi",
      displayName: titled,
      siteKey: cleaned.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    };
  }

  // Fallback neutre — pas de marque agrégateur tierce
  return {
    aggregationSource: "darbladi",
    displayName: "Annonce",
    siteKey: "portal",
  };
}

export function sourceBadgeStyle(source: string): { label: string; color: string } {
  const styles: Record<string, { label: string; color: string }> = {
    "holding-immo": { label: "Holding IMMO", color: "bg-emerald-100 text-emerald-800" },
    darbladi: { label: "DarBladi", color: "bg-teal-100 text-teal-800" },
    "samsar-ia": { label: "DarBladi", color: "bg-teal-100 text-teal-800" },
    avito: { label: "Avito.ma", color: "bg-orange-100 text-orange-800" },
    mubawab: { label: "Mubawab.ma", color: "bg-blue-100 text-blue-800" },
    sarouty: { label: "Sarouty.ma", color: "bg-purple-100 text-purple-800" },
    agenz: { label: "Agenz.ma", color: "bg-sky-100 text-sky-800" },
    yakeey: { label: "Yakeey", color: "bg-rose-100 text-rose-800" },
  };
  return styles[source] ?? { label: source, color: "bg-gray-100 text-gray-700" };
}
