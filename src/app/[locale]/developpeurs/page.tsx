import { buildMetadata } from "@/lib/seo/metadata";
import { requireAdminPage } from "@/lib/auth/require-admin-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Admin — API partenaires",
    description: "Documentation API privée DarBladi (accès admin).",
    path: "/developpeurs",
    locale,
  });
}

export default async function DeveloppeursPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  await requireAdminPage(locale, sp, { nextPath: `/${locale}/developpeurs` });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-bronze">Espace admin</p>
      <h1 className="font-serif text-3xl">API partenaires DarBladi</h1>
      <p className="mt-4 text-charcoal/70">
        Documentation privée — non visible pour les utilisateurs du site public.
      </p>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="font-serif text-xl">Authentification</h2>
          <p className="mt-2 text-sm text-charcoal/70">
            Header <code className="rounded bg-sand px-1">X-API-Key</code> partenaire, ou accès admin via{" "}
            <code className="rounded bg-sand px-1">ADMIN_KEY</code> / session admin.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl">Endpoints</h2>
          <ul className="mt-4 space-y-4 text-sm">
            <li className="rounded-lg border border-charcoal/10 p-4">
              <p className="font-mono font-medium">GET {baseUrl}/api/v1/health</p>
              <p className="mt-1 text-charcoal/60">Statut public (sans clé)</p>
            </li>
            <li className="rounded-lg border border-charcoal/10 p-4">
              <p className="font-mono font-medium">GET {baseUrl}/api/v1/aggregation/status</p>
              <p className="mt-1 text-charcoal/60">Admin uniquement (`?key=` ou session)</p>
            </li>
            <li className="rounded-lg border border-charcoal/10 p-4">
              <p className="font-mono font-medium">GET {baseUrl}/api/v1/listings</p>
              <p className="mt-1 text-charcoal/60">
                Paramètres : city, neighborhood, transactionType, minPrice, maxPrice, page, limit
              </p>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl">Page sources</h2>
          <p className="mt-2 text-sm text-charcoal/70">
            <a href={`/${locale}/agregateur`} className="text-deep-green hover:underline">
              /{locale}/agregateur
            </a>{" "}
            — réservée admin (compte admin ou <code className="rounded bg-sand px-1">?key=ADMIN_KEY</code>).
          </p>
        </div>
      </section>
    </div>
  );
}
