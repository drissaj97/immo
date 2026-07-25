import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "API partenaires",
    description: "Documentation API publique DarBladi pour agences et intégrateurs.",
    path: "/developpeurs",
    locale,
  });
}

export default async function DeveloppeursPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">API partenaires DarBladi</h1>
      <p className="mt-4 text-charcoal/70">
        API REST v1 pour intégrer le catalogue et les métriques sectorielles. Données de démonstration.
      </p>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="font-serif text-xl">Authentification</h2>
          <p className="mt-2 text-sm text-charcoal/70">
            Header <code className="rounded bg-sand px-1">X-API-Key: darbladi-demo-partner-key</code> ou{" "}
            <code className="rounded bg-sand px-1">Authorization: Bearer darbladi-demo-partner-key</code>
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
              <p className="font-mono font-medium">GET {baseUrl}/api/v1/listings</p>
              <p className="mt-1 text-charcoal/60">
                Paramètres : city, neighborhood, transactionType, minPrice, maxPrice, page, limit (max 50)
              </p>
            </li>
            <li className="rounded-lg border border-charcoal/10 p-4">
              <p className="font-mono font-medium">GET {baseUrl}/api/v1/listings/{"{id}"}</p>
              <p className="mt-1 text-charcoal/60">Détail d&apos;une annonce publiée</p>
            </li>
            <li className="rounded-lg border border-charcoal/10 p-4">
              <p className="font-mono font-medium">GET {baseUrl}/api/v1/market-metrics</p>
              <p className="mt-1 text-charcoal/60">Paramètre optionnel : city</p>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-xl">Exemple cURL</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-charcoal p-4 text-xs text-ivory">
{`curl -H "X-API-Key: darbladi-demo-partner-key" \\
  "${baseUrl}/api/v1/listings?city=Marrakech&limit=5"`}
          </pre>
        </div>

        <div>
          <h2 className="font-serif text-xl">Rate limiting</h2>
          <p className="mt-2 text-sm text-charcoal/70">
            60 requêtes/minute par clé. Headers : X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-xl">Conformité</h2>
          <p className="mt-2 text-sm text-charcoal/70">
            Usage soumis aux{" "}
            <a href={`/${locale}/conditions`} className="text-deep-green hover:underline">
              conditions d&apos;utilisation
            </a>{" "}
            et à la{" "}
            <a href={`/${locale}/conformite`} className="text-deep-green hover:underline">
              politique CNDP
            </a>
            . Attribution source obligatoire.
          </p>
        </div>
      </section>
    </div>
  );
}
