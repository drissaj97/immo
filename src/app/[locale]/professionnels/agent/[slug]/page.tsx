import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo/metadata";
import { getProfessionalBySlug } from "@/lib/data/marketplace-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const pro = getProfessionalBySlug(slug);
  if (!pro) return {};
  return buildMetadata({
    title: pro.displayName,
    description: pro.bio,
    path: `/professionnels/agent/${slug}`,
    locale,
  });
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const pro = getProfessionalBySlug(slug);
  if (!pro) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <Link href={`/${locale}/professionnels`} className="text-sm text-deep-green hover:underline">
        ← Professionnels
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <h1 className="font-serif text-3xl">{pro.displayName}</h1>
        {pro.isVerified && <Badge variant="verified">Vérifié</Badge>}
      </div>
      <p className="mt-2 text-charcoal/60">
        {pro.organizationName} · {pro.city}
      </p>
      <p className="mt-6 text-charcoal/80">{pro.bio}</p>
      <Link href={`/${locale}/contact`} className="mt-8 inline-block rounded-lg bg-deep-green px-4 py-2 text-sm text-ivory">
        Contacter
      </Link>
    </div>
  );
}
