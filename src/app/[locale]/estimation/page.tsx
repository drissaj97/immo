import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Estimation immobilière", description: "Estimez la valeur de votre bien.", path: "/estimation", locale });
}

export default function EstimationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Estimation</h1>
      <p className="mt-4 text-charcoal/70">Module d&apos;estimation basé sur comparables — Phase 2. Utilisez le simulateur en attendant.</p>
    </div>
  );
}
