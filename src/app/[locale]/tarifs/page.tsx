import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Tarifs", description: "Offres DarBladi pour particuliers et professionnels.", path: "/tarifs", locale });
}

export default function TarifsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Tarifs</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {["Gratuit", "Investisseur Premium", "Professionnel Pro"].map((plan) => (
          <div key={plan} className="rounded-lg border border-charcoal/10 p-6">
            <h2 className="font-serif text-xl">{plan}</h2>
            <p className="mt-2 text-sm text-charcoal/60">Architecture prête — paiement non intégré au MVP.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
