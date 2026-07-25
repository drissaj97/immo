import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Investir au Maroc", description: "Outils d'aide à la décision pour investisseurs.", path: "/investir", locale });
}

export default async function InvestirPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Investir</h1>
      <p className="mt-4 max-w-2xl text-charcoal/70">
        Comparez des biens, simulez la rentabilité nette et recevez des analyses fondées sur des données vérifiables.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href={`/${locale}/simulateur-rentabilite`}><Button>Simulateur</Button></Link>
        <Link href={`/${locale}/comparer`}><Button variant="outline">Comparateur</Button></Link>
        <Link href={`/${locale}/samsar-ia`}><Button variant="secondary">Assistant IA</Button></Link>
      </div>
    </div>
  );
}
