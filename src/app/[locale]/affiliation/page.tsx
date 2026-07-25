import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { AFFILIATE_PROFILES } from "@/lib/data/affiliates";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Programme d'affiliation",
    description: "Parrainez des clients et percevez une commission sur Samsar IA.",
    path: "/affiliation",
    locale,
  });
}

export default async function AffiliationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Programme d&apos;affiliation Samsar IA</h1>
      <p className="mt-4 text-charcoal/70">
        Agents et partenaires : partagez votre lien de parrainage et suivez vos conversions. Données fictives.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-xl">Comment ça marche</h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-charcoal/80">
          <li>Obtenez votre code affilié unique</li>
          <li>Partagez : <code className="rounded bg-sand px-1">{process.env.NEXT_PUBLIC_APP_URL ?? "https://samsar.demo"}/fr?ref=VOTRE_CODE</code></li>
          <li>Suivez visites, inscriptions et leads dans votre dashboard</li>
          <li>Commission sur acomptes et abonnements (démo)</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl">Codes démo</h2>
        <div className="mt-4 space-y-3">
          {AFFILIATE_PROFILES.map((a) => (
            <div key={a.code} className="rounded-lg border border-charcoal/10 p-4">
              <p className="font-mono font-medium text-deep-green">{a.code}</p>
              <p className="text-sm text-charcoal/60">{a.agentName} · Commission {(a.commissionRate * 100).toFixed(1)} %</p>
              <Link
                href={`/${locale}?ref=${a.code}`}
                className="mt-2 inline-block text-sm text-deep-green hover:underline"
              >
                Tester le lien →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <Link href={`/${locale}/dashboard/affiliation`} className="mt-8 inline-block text-deep-green hover:underline">
        Dashboard affiliation (agents) →
      </Link>
    </div>
  );
}
