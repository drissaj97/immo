import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Programmes neufs", description: "Projets immobiliers neufs au Maroc.", path: "/projets", locale });
}

export default function ProjetsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Projets neufs</h1>
      <p className="mt-4 text-charcoal/70">Phase 4 — catalogues promoteurs à venir. Données démo disponibles via /neuf.</p>
    </div>
  );
}
