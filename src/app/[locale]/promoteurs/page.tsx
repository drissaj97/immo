import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo/metadata";
import { DEMO_PROJECTS, getDevelopers } from "@/lib/data/marketplace-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Promoteurs immobiliers",
    description: "Programmes neufs et promoteurs partenaires.",
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
        Programmes neufs et promoteurs partenaires. Données fictives.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-xl">Promoteurs</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {developers.map((dev) => (
            <Link
              key={dev.id}
              href={`/${locale}/promoteurs/${dev.slug}`}
              className="rounded-lg border border-charcoal/10 p-6 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-serif text-lg">{dev.name}</h3>
                {dev.isVerified && <Badge variant="verified">Vérifié</Badge>}
              </div>
              <p className="mt-2 text-sm text-charcoal/60">{dev.city}</p>
              <p className="mt-3 text-sm text-charcoal/70">{dev.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl">Programmes neufs</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DEMO_PROJECTS.map((project) => (
            <div key={project.id} className="rounded-lg border border-charcoal/10 p-5">
              <Badge>{project.status === "presale" ? "Précommercialisation" : "En vente"}</Badge>
              <h3 className="mt-3 font-serif text-lg">{project.name}</h3>
              <p className="text-sm text-charcoal/60">
                {project.neighborhood}, {project.city}
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-charcoal/70">{project.description}</p>
              {project.deliveryDate && (
                <p className="mt-3 text-xs text-charcoal/40">
                  Livraison : {new Date(project.deliveryDate).toLocaleDateString("fr-MA")}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
