import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Mentions légales", description: "Mentions légales DarBladi.", path: "/mentions-legales", locale });
}

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Mentions légales</h1>
      <p className="mt-4 text-sm text-charcoal/70">Éditeur fictif — MVP démonstration. Conformité Loi 09-08 (Maroc) et RGPD en cours de structuration.</p>
    </div>
  );
}
