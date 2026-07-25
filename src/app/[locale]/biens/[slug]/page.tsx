import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bed, Bath, Maximize, MapPin, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyMap } from "@/components/maps/property-map";
import { getListingBySlug } from "@/server/repositories/listings";
import { buildMetadata, listingJsonLd } from "@/lib/seo/metadata";
import { formatPrice } from "@/lib/utils";
import { FavoriteButton } from "@/components/listings/favorite-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return {};
  return buildMetadata({
    title: listing.title,
    description: listing.description.slice(0, 160),
    path: `/biens/${slug}`,
    locale,
  });
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const jsonLd = listingJsonLd({
    title: listing.title,
    description: listing.description,
    price: listing.price,
    currency: listing.currency,
    slug: listing.slug,
    images: listing.images,
    city: listing.location.city,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Link href={`/${locale}/biens`} className="text-sm text-deep-green hover:underline">
          ← Retour aux résultats
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sand">
            <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" priority />
          </div>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="demo">Donnée démo</Badge>
              {listing.isVerified && <Badge variant="verified">Annonce vérifiée</Badge>}
            </div>
            <h1 className="mt-4 font-serif text-3xl">{listing.title}</h1>
            <p className="mt-2 flex items-center gap-1 text-charcoal/60">
              <MapPin className="h-4 w-4" />
              {listing.location.neighborhood}, {listing.location.city}
            </p>
            <p className="mt-4 text-3xl font-medium text-deep-green">
              {formatPrice(listing.price, listing.currency)}
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              {listing.bedrooms !== undefined && (
                <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {listing.bedrooms} ch.</span>
              )}
              {listing.bathrooms !== undefined && (
                <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {listing.bathrooms} sdb</span>
              )}
              {listing.livingArea && (
                <span className="flex items-center gap-1"><Maximize className="h-4 w-4" /> {listing.livingArea} m²</span>
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <FavoriteButton listingId={listing.id} locale={locale} />
              <Link href={`/${locale}/comparer?a=${listing.id}`}>
                <Button variant="outline">Comparer</Button>
              </Link>
              <Link href={`/${locale}/simulateur-rentabilite?price=${listing.price}`}>
                <Button variant="secondary">Simuler rentabilité</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-serif text-2xl">Description</h2>
              <p className="mt-4 leading-relaxed text-charcoal/80">{listing.description}</p>
            </section>
            <section>
              <h2 className="font-serif text-2xl">Localisation approximative</h2>
              <div className="mt-4 h-80 overflow-hidden rounded-lg border border-charcoal/10">
                <PropertyMap listings={[listing]} center={[listing.longitude, listing.latitude]} zoom={13} />
              </div>
            </section>
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border border-charcoal/10 p-4">
              <h3 className="font-medium flex items-center gap-2"><Shield className="h-4 w-4" /> Provenance</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div><dt className="text-charcoal/50">Source</dt><dd>{listing.sourceName}</dd></div>
                <div><dt className="text-charcoal/50">Type</dt><dd>{listing.sourceType}</dd></div>
                <div><dt className="text-charcoal/50">Complétude</dt><dd>{listing.completenessScore} %</dd></div>
                <div><dt className="text-charcoal/50">Fraîcheur</dt><dd>{listing.freshnessScore} %</dd></div>
                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><dd>Réf. {listing.reference}</dd></div>
              </dl>
            </div>
            {listing.estimatedYield && (
              <div className="rounded-lg border border-deep-green/20 bg-deep-green/5 p-4">
                <p className="text-sm text-charcoal/60">Rendement estimé (indicatif)</p>
                <p className="text-2xl font-medium text-deep-green">{listing.estimatedYield} %</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
