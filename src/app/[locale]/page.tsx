import { PropertySearch } from "@/components/search/property-search";
import { ListingCard } from "@/components/listings/listing-card";
import { getFeaturedListings, getCities } from "@/server/repositories/listings";
import { getSemsaraiTotalCount } from "@/lib/semsarai/live-search";
import Link from "next/link";
import { getMessages, type Locale } from "@/lib/i18n/config";
import { buildMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Plateforme immobilière intelligente au Maroc",
    description:
      "Recherchez, comparez et investissez dans l'immobilier marocain avec des données fiables et l'assistant DarBladi.",
    locale,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = getMessages(locale as Locale);
  const featured = await getFeaturedListings(6);
  const cities = await getCities();
  const apiTotal = await getSemsaraiTotalCount().catch(() => null);

  return (
    <>
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(28,28,26,0.45), rgba(28,28,26,0.7)), url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80')",
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center text-ivory">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-ivory/80">
            {apiTotal
              ? `${apiTotal.toLocaleString("fr-MA")}+ annonces · Tout le Maroc`
              : "Maroc · Données · Intelligence"}
          </p>
          <h1 className="font-serif text-4xl font-medium leading-tight md:text-6xl">
            Toutes les annonces immobilières du Maroc, en un seul endroit.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ivory/85">
            DarBladi agrège les biens de semsarai.ma, Holding IMMO et partenaires agréés — recherche,
            investissement et assistant intelligent.
          </p>
          <div className="mt-10 text-left">
            <PropertySearch locale={locale} variant="hero" />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}/darbladi`}>
              <Button variant="bronze">Essayer DarBladi</Button>
            </Link>
            <Link href={`/${locale}/simulateur-rentabilite`}>
              <Button variant="outline" className="border-ivory/30 text-ivory hover:bg-ivory/10">
                Simulateur rentabilité
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl text-charcoal">Annonces immobilières au Maroc</h2>
            <p className="mt-2 text-charcoal/60">
              Biens indexés depuis semsarai.ma, Holding IMMO et partenaires agréés
            </p>
          </div>
          <Link href={`/${locale}/biens`} className="text-sm text-deep-green hover:underline">
            Voir tout →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} locale={locale} />
          ))}
        </div>
      </section>

      <section className="bg-sand/40 py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="font-serif text-3xl">Villes couvertes</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {cities.map(({ city, count }) => (
              <Link
                key={city}
                href={`/${locale}/biens?city=${encodeURIComponent(city)}`}
                className="rounded-lg border border-charcoal/10 bg-ivory p-6 transition hover:border-deep-green/30"
              >
                <p className="font-serif text-xl">{city}</p>
                <p className="mt-1 text-sm text-charcoal/60">{count} annonces</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { title: "Recherche intelligente", desc: "Filtres classiques ou langage naturel via DarBladi." },
            { title: "Investissement", desc: "Simulateur de rentabilité, comparateur et scores transparents." },
            { title: "Professionnels", desc: "Publication, CRM et validation pour agences et promoteurs." },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-charcoal/10 p-6">
              <h3 className="font-serif text-xl">{item.title}</h3>
              <p className="mt-2 text-sm text-charcoal/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
