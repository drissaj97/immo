import type { ListingWithLocation } from "@/server/repositories/listings";
import { resolveExternalSourceUrl } from "@/lib/listings/external-source-url";

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  "holding-immo": { label: "Holding IMMO", color: "bg-emerald-100 text-emerald-800" },
  darbladi: { label: "DarBladi", color: "bg-teal-100 text-teal-800" },
  semsarai: { label: "SEMSAR AI", color: "bg-indigo-100 text-indigo-800" },
  "samsar-ia": { label: "DarBladi", color: "bg-teal-100 text-teal-800" },
  avito: { label: "Avito.ma", color: "bg-orange-100 text-orange-800" },
  mubawab: { label: "Mubawab", color: "bg-blue-100 text-blue-800" },
  sarouty: { label: "Sarouty", color: "bg-purple-100 text-purple-800" },
};

export function SourceBadge({ listing }: { listing: ListingWithLocation }) {
  const source = listing.aggregationSource ?? "darbladi";
  const config = SOURCE_LABELS[source] ?? { label: listing.sourceName, color: "bg-gray-100 text-gray-700" };

  return (
    <span className={`mr-1.5 inline-flex rounded px-2 py-0.5 text-xs font-medium last:mr-0 ${config.color}`}>
      {config.label}
    </span>
  );
}

export function ExternalListingBanner({
  listing,
}: {
  listing: ListingWithLocation;
  locale?: string;
}) {
  const href = resolveExternalSourceUrl(listing);
  if (!listing.isExternal || !href) return null;

  return (
    <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50/80 p-4">
      <p className="text-sm text-charcoal/80">
        Annonce agrégée depuis <strong>{listing.sourceName}</strong>. Les informations peuvent avoir changé —
        consultez la source originale.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Voir sur {listing.sourceName} →
      </a>
    </div>
  );
}
