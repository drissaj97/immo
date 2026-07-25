import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Conditions d'utilisation", description: "CGU Samsar IA.", path: "/conditions", locale });
}

export default function ConditionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Conditions d&apos;utilisation</h1>
      <p className="mt-4 text-sm text-charcoal/70">Les données de démonstration ne constituent pas des annonces réelles.</p>
    </div>
  );
}
