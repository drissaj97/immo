import { InvestmentSimulator } from "@/components/investment/investment-simulator";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Simulateur de rentabilité", description: "Calculez rendement, cash-flow et scénarios.", path: "/simulateur-rentabilite", locale });
}

export default async function SimulateurPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ price?: string; listingId?: string }>;
}) {
  const { locale } = await params;
  const { price, listingId } = await searchParams;
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Simulateur de rentabilité</h1>
      <p className="mt-2 text-charcoal/60">Calculs déterministes — scénarios prudent, central et optimiste. Sauvegardez vos simulations connecté.</p>
      <div className="mt-8">
        <InvestmentSimulator
          initialPrice={price ? Number(price) : undefined}
          locale={locale}
          listingId={listingId}
        />
      </div>
    </div>
  );
}
