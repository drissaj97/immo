import Link from "next/link";
import { Bed, Bath, Maximize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListingImage } from "@/components/listings/listing-image";
import { formatPrice } from "@/lib/utils";
import type { ListingWithLocation } from "@/server/repositories/listings";
import { convertPrice } from "@/lib/currency";
import { SourceBadge } from "@/components/listings/source-badge";

export function ListingCard({
  listing,
  locale,
  currency = "MAD",
}: {
  listing: ListingWithLocation;
  locale: string;
  currency?: "MAD" | "EUR" | "USD";
}) {
  const displayPrice =
    currency === listing.currency
      ? listing.price
      : convertPrice(listing.price, listing.currency, currency).amount;

  const transactionLabel =
    listing.transactionType === "sale"
      ? "À vendre"
      : listing.transactionType === "long_term_rent"
        ? "Location"
        : "Saisonnier";

  return (
    <Link
      href={`/${locale}/biens/${listing.slug}`}
      className="group block overflow-hidden rounded-lg border border-charcoal/10 bg-ivory transition-shadow hover:shadow-lg"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden bg-sand"
        style={{ minHeight: 180, background: "#e8e0d4" }}
      >
        <ListingImage
          src={listing.images?.[0] ?? ""}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          <Badge>{transactionLabel}</Badge>
          {listing.isVerified && <Badge variant="verified">Vérifié</Badge>}
          <SourceBadge listing={listing} />
        </div>
      </div>
      <div className="p-4">
        <p className="text-lg font-medium text-deep-green">
          {formatPrice(displayPrice, currency)}
        </p>
        <h3 className="mt-1 line-clamp-2 font-serif text-base text-charcoal group-hover:text-deep-green">
          {listing.title}
        </h3>
        <p className="mt-1 text-sm text-charcoal/60">
          {listing.location.neighborhood}, {listing.location.city}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-charcoal/70">
          {listing.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" /> {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {listing.bathrooms}
            </span>
          )}
          {listing.livingArea && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5" /> {listing.livingArea} m²
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-charcoal/40">
          Réf. {listing.reference}
          {listing.sourceName && ` · ${listing.sourceName}`}
        </p>
      </div>
    </Link>
  );
}
