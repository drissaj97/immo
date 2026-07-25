import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo/metadata";
import { getAgencies, DEMO_PROFESSIONALS } from "@/lib/data/marketplace-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Professionnels immobiliers",
    description: "Agences et agents vérifiés au Maroc.",
    path: "/professionnels",
    locale,
  });
}

export default async function ProfessionnelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const agencies = getAgencies();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Professionnels immobiliers</h1>
      <p className="mt-2 max-w-2xl text-charcoal/70">
        Agences et agents partenaires Samsar IA. Données fictives à des fins de démonstration.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-xl">Agences</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agencies.map((org) => (
            <Link
              key={org.id}
              href={`/${locale}/professionnels/${org.slug}`}
              className="rounded-lg border border-charcoal/10 p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-lg">{org.name}</h3>
                {org.isVerified && <Badge variant="verified">Vérifié</Badge>}
              </div>
              <p className="mt-2 text-sm text-charcoal/60">{org.city}</p>
              <p className="mt-3 line-clamp-3 text-sm text-charcoal/70">{org.description}</p>
              <p className="mt-4 text-xs text-charcoal/40">{org.listingCount} annonces actives</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl">Agents</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_PROFESSIONALS.map((pro) => (
            <Link
              key={pro.id}
              href={`/${locale}/professionnels/agent/${pro.slug}`}
              className="rounded-lg border border-charcoal/10 p-5 hover:border-deep-green/30"
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">{pro.displayName}</p>
                {pro.isVerified && <Badge variant="verified">Vérifié</Badge>}
              </div>
              <p className="mt-1 text-sm text-charcoal/60">{pro.organizationName} · {pro.city}</p>
              <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">{pro.bio}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
