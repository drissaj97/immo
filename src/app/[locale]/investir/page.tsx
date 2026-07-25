import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Investir au Maroc", description: "Outils d'aide à la décision pour investisseurs.", path: "/investir", locale });
}

export default async function InvestirPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tools = [
    { href: `/${locale}/simulateur-rentabilite`, title: "Simulateur de rentabilité", desc: "Scénarios prudent, central et optimiste. Sauvegarde des hypothèses." },
    { href: `/${locale}/comparer`, title: "Comparateur", desc: "Comparez deux biens avec scores investissement et cash-flow." },
    { href: `/${locale}/estimation`, title: "Estimation", desc: "Estimez un bien par comparables de vente récents (données démo)." },
    { href: `/${locale}/dashboard/simulations`, title: "Mes simulations", desc: "Retrouvez vos simulations et rapports générés." },
    { href: `/${locale}/samsar-ia`, title: "Samsar IA", desc: "Recherche conversationnelle orientée investissement." },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Investir au Maroc</h1>
      <p className="mt-4 max-w-2xl text-charcoal/70">
        Score transparent, historique de prix, comparables et rapports — toutes les données de démonstration sont clairement identifiées.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="rounded-lg border border-charcoal/10 p-6 hover:border-deep-green/30 transition">
            <h2 className="font-serif text-xl">{t.title}</h2>
            <p className="mt-2 text-sm text-charcoal/70">{t.desc}</p>
          </Link>
        ))}
      </div>
      <div className="mt-10">
        <Link href={`/${locale}/biens?transactionType=sale`}>
          <Button>Parcourir les biens à vendre</Button>
        </Link>
      </div>
    </div>
  );
}
