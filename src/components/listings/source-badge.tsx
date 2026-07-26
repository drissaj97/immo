import type { ListingWithLocation } from "@/server/repositories/listings";
import { resolveExternalSourceUrl } from "@/lib/listings/external-source-url";
import { resolveOriginalPortal, sourceBadgeStyle } from "@/lib/listings/original-portal";

export function SourceBadge({ listing }: { listing: ListingWithLocation }) {
  const portal = resolveOriginalPortal({
    sourceName: listing.sourceName,
    sourceUrl: listing.sourceUrl,
  });
  const sourceKey =
    listing.aggregationSource && listing.aggregationSource !== "semsarai"
      ? listing.aggregationSource
      : portal.aggregationSource;
  const config = sourceBadgeStyle(sourceKey);
  const label =
    listing.aggregationSource === "holding-immo" || listing.aggregationSource === "darbladi"
      ? config.label
      : portal.displayName || config.label;

  return (
    <span className={`mr-1.5 inline-flex rounded px-2 py-0.5 text-xs font-medium last:mr-0 ${config.color}`}>
      {label}
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

  const portal = resolveOriginalPortal({
    sourceName: listing.sourceName,
    sourceUrl: listing.sourceUrl ?? href,
  });
  const name = portal.displayName || listing.sourceName || "la source";

  return (
    <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50/80 p-4">
      <p className="text-sm text-charcoal/80">
        Annonce agrégée depuis <strong>{name}</strong>. Les informations peuvent avoir changé —
        consultez la source originale.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
      >
        Voir sur {name} →
      </a>
    </div>
  );
}
