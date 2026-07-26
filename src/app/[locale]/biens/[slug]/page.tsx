import Link from "next/link";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { notFound } from "next/navigation";
import { Bed, Bath, Maximize, MapPin, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyMapLazy } from "@/components/maps/property-map-lazy";
import { prepareMapPageData } from "@/lib/map/prepare-map-page";
import { getListingBySlug } from "@/server/repositories/listings";
import { buildMetadata, listingJsonLd } from "@/lib/seo/metadata";
import { formatPrice } from "@/lib/utils";
import { FavoriteButton } from "@/components/listings/favorite-button";
import { ListingInquiryForm } from "@/components/listings/listing-inquiry-form";
import { ExternalListingBanner, SourceBadge } from "@/components/listings/source-badge";
import { resolveExternalSourceUrl } from "@/lib/listings/external-source-url";
import { InvestmentScoreCard } from "@/components/investment/investment-score-card";
import { PriceHistoryChart } from "@/components/investment/price-history-chart";
import { GenerateReportButton } from "@/components/investment/generate-report-button";
import { ReserveDepositButton } from "@/components/payment/reserve-deposit-button";
import { listingAllowsDepositReservation } from "@/lib/listings/deposit-reservation";
import {
  getListingInvestmentScore,
  getPriceHistory,
  getListingValuation,
} from "@/server/repositories/investment";

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

  // Source originale (Mubawab / Avito…) affichée publiquement — jamais Semsar AI
  const revealSources = true;
  const score = getListingInvestmentScore(listing, { revealSources });
  const priceHistory = getPriceHistory(listing);
  const valuation = getListingValuation(listing);
  const mapData = await prepareMapPageData([listing]);

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
          <ListingGallery images={listing.images} title={listing.title} />
          <div>
            <div className="flex flex-wrap gap-2">
              {!listing.isDemo && !listing.isExternal && (
                <Badge variant="verified">Annonce DarBladi</Badge>
              )}
              {listing.isDemo && !listing.isExternal && <Badge variant="demo">Donnée démo</Badge>}
              {listing.isVerified && <Badge variant="verified">Vérifiée</Badge>}
              {revealSources && <SourceBadge listing={listing} />}
            </div>
            {revealSources && <ExternalListingBanner listing={listing} />}
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
            <div className="mt-6 flex flex-wrap gap-3">
              <FavoriteButton listingId={listing.id} locale={locale} />
              <Link href={`/${locale}/comparer?a=${listing.id}`}>
                <Button variant="outline">Comparer</Button>
              </Link>
              <Link href={`/${locale}/simulateur-rentabilite?price=${listing.price}&listingId=${listing.id}`}>
                <Button variant="secondary">Simuler rentabilité</Button>
              </Link>
              <GenerateReportButton listingId={listing.id} locale={locale} />
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
              <h2 className="font-serif text-2xl">Historique de prix</h2>
              <div className="mt-4 rounded-lg border border-charcoal/10 p-4">
                <PriceHistoryChart history={priceHistory} currentPrice={listing.price} />
              </div>
            </section>
            <section>
              <h2 className="font-serif text-2xl">Localisation</h2>
              <div className="mt-4 h-80 overflow-hidden rounded-lg border border-charcoal/10">
                <PropertyMapLazy
                  points={mapData.points}
                  nearbyPoisByKey={mapData.nearbyPoisByKey}
                  nearbyPois={mapData.nearbyPois}
                  locale={locale}
                  neighborhoodLabel={`${listing.location.neighborhood}, ${listing.location.city}`}
                  zoom={14}
                />
              </div>
            </section>
          </div>
          <aside className="space-y-4">
            <ListingInquiryForm
              locale={locale}
              listingId={listing.id}
              listingTitle={listing.title}
            />
            {listingAllowsDepositReservation(listing) && (
              <ReserveDepositButton
                listingId={listing.id}
                listingTitle={listing.title}
                price={listing.price}
                locale={locale}
              />
            )}
            <InvestmentScoreCard score={score} />
            {valuation && (
              <div className="rounded-lg border border-charcoal/10 p-4">
                <p className="text-sm text-charcoal/60">Estimation par comparables (démo)</p>
                <p className="mt-1 font-medium text-deep-green">
                  {formatPrice(valuation.estimatedMin, "MAD")} — {formatPrice(valuation.estimatedMax, "MAD")}
                </p>
                <p className="mt-1 text-xs text-charcoal/50">{valuation.comparablesUsed.length} comparable(s) · {valuation.methodology}</p>
              </div>
            )}
            <div className="rounded-lg border border-charcoal/10 p-4">
              <h3 className="font-medium flex items-center gap-2"><Shield className="h-4 w-4" /> Provenance</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {revealSources ? (
                  <>
                    <div><dt className="text-charcoal/50">Source</dt><dd>{listing.sourceName}</dd></div>
                    {(() => {
                      const sourceHref = resolveExternalSourceUrl(listing);
                      if (!sourceHref) return null;
                      return (
                        <div>
                          <dt className="text-charcoal/50">Lien original</dt>
                          <dd>
                            <a
                              href={sourceHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-deep-green hover:underline"
                            >
                              Voir l&apos;annonce source →
                            </a>
                          </dd>
                        </div>
                      );
                    })()}
                    <div><dt className="text-charcoal/50">Type</dt><dd>{listing.sourceType}</dd></div>
                    <div><dt className="text-charcoal/50">Complétude</dt><dd>{listing.completenessScore} %</dd></div>
                    <div><dt className="text-charcoal/50">Fraîcheur</dt><dd>{listing.freshnessScore} %</dd></div>
                  </>
                ) : (
                  <div>
                    <dt className="text-charcoal/50">Publication</dt>
                    <dd>DarBladi</dd>
                  </div>
                )}
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
