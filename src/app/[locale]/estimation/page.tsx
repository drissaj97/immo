import { EstimationTool } from "@/components/investment/estimation-tool";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Estimation immobilière", description: "Estimez la valeur de votre bien par comparables.", path: "/estimation", locale });
}

export default async function EstimationPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Estimation immobilière</h1>
      <p className="mt-2 text-charcoal/60">
        Estimation indicative basée sur des comparables de vente fictifs et des moyennes sectorielles.
      </p>
      <div className="mt-8">
        <EstimationTool />
      </div>
    </div>
  );
}
