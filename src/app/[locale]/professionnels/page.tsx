import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo/metadata";
import { getAgencies } from "@/lib/data/marketplace-data";
import { canAccessAdminTools } from "@/lib/auth/admin-access";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Professionnels immobiliers",
    description: "Agences immobilières sur DarBladi — annonces au Maroc.",
    path: "/professionnels",
    locale,
  });
}

export default async function ProfessionnelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const rawKey = sp.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  const admin = await canAccessAdminTools({ key });

  // Public : agences first-party uniquement. Partenaires agrégés = admin.
  const agencies = getAgencies().filter((org) =>
    admin.ok ? true : org.type === "agency",
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Professionnels immobiliers</h1>
      <p className="mt-2 max-w-2xl text-charcoal/70">
        Agences présentes sur DarBladi — annonces immobilières au Maroc.
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
              <p className="mt-4 text-xs text-deep-green">{org.listingCount} annonces indexées</p>
            </Link>
          ))}
        </div>
      </section>

      {admin.ok && (
        <section className="mt-12 rounded-lg border border-charcoal/10 bg-sand/30 p-6">
          <h2 className="font-serif text-xl">Espace admin</h2>
          <p className="mt-2 text-sm text-charcoal/70">
            Sources partenaires et documentation API — visibles uniquement avec un compte admin ou{" "}
            <code className="rounded bg-sand px-1">ADMIN_KEY</code>.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href={`/${locale}/agregateur`} className="text-deep-green hover:underline">
              Sources partenaires →
            </Link>
            <Link href={`/${locale}/developpeurs`} className="text-deep-green hover:underline">
              Documentation API →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
