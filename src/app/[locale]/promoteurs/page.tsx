import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getDevelopers } from "@/lib/data/marketplace-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Promoteurs immobiliers",
    description: "Programmes neufs et promoteurs partenaires indexés sur DarBladi.",
    path: "/promoteurs",
    locale,
  });
}

export default async function PromoteursPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const developers = getDevelopers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Promoteurs immobiliers</h1>
      <p className="mt-2 max-w-2xl text-charcoal/70">
        Programmes neufs via partenaires agréés. Les promoteurs fictifs ont été retirés — seuls les partenaires
        réels apparaîtront ici.
      </p>

      {developers.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-serif text-xl">Promoteurs</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {developers.map((dev) => (
              <Link
                key={dev.id}
                href={`/${locale}/promoteurs/${dev.slug}`}
                className="rounded-lg border border-charcoal/10 p-6 hover:shadow-md"
              >
                <h3 className="font-serif text-lg">{dev.name}</h3>
                <p className="mt-2 text-sm text-charcoal/60">{dev.city}</p>
                <p className="mt-3 text-sm text-charcoal/70">{dev.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-lg border border-charcoal/10 bg-sand/30 p-8 text-center">
          <p className="text-charcoal/70">
            Aucun promoteur partenaire pour le moment. Contactez-nous pour indexer vos programmes neufs.
          </p>
          <Link href={`/${locale}/contact`} className="mt-4 inline-block text-deep-green hover:underline">
            Nous contacter →
          </Link>
        </section>
      )}
    </div>
  );
}
