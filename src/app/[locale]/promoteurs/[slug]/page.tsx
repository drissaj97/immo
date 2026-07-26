import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo/metadata";
import { getOrganizationBySlug, getProjectsByOrganization } from "@/lib/data/marketplace-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org) return {};
  return buildMetadata({
    title: org.name,
    description: org.description,
    path: `/promoteurs/${slug}`,
    locale,
  });
}

export default async function PromoteurPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org || org.type !== "developer") notFound();

  const projects = getProjectsByOrganization(org.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <Link href={`/${locale}/promoteurs`} className="text-sm text-deep-green hover:underline">
        ← Promoteurs
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <h1 className="font-serif text-3xl">{org.name}</h1>
        {org.isVerified && <Badge variant="verified">Vérifié</Badge>}
      </div>
      <p className="mt-2 text-charcoal/60">{org.city}</p>
      <p className="mt-6 text-charcoal/80">{org.description}</p>

      <section className="mt-10">
        <h2 className="font-serif text-xl">Programmes</h2>
        {projects.length === 0 ? (
          <p className="mt-4 text-charcoal/60">Aucun programme listé.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {projects.map((p) => (
              <li key={p.id} className="rounded-lg border border-charcoal/10 p-4">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-charcoal/60">
                  {p.neighborhood}, {p.city}
                </p>
                <p className="mt-2 text-sm text-charcoal/70">{p.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
