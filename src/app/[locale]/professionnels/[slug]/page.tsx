import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo/metadata";
import { getOrganizationBySlug } from "@/lib/data/marketplace-data";

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
    path: `/professionnels/${slug}`,
    locale,
  });
}

export default async function AgencePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org || org.type !== "agency") notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <Link href={`/${locale}/professionnels`} className="text-sm text-deep-green hover:underline">
        ← Professionnels
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <h1 className="font-serif text-3xl">{org.name}</h1>
        {org.isVerified && <Badge variant="verified">Vérifié</Badge>}
      </div>
      <p className="mt-2 text-charcoal/60">{org.city}</p>
      <p className="mt-6 text-charcoal/80">{org.description}</p>
      <p className="mt-6 text-sm text-charcoal/50">{org.listingCount} annonces · Données fictives</p>
      <Link
        href={`/${locale}/biens?city=${encodeURIComponent(org.city)}`}
        className="mt-8 inline-block text-deep-green hover:underline"
      >
        Voir les annonces à {org.city} →
      </Link>
    </div>
  );
}
