import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Confidentialité", description: "Politique de confidentialité.", path: "/confidentialite", locale });
}

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Politique de confidentialité</h1>
      <p className="mt-4 text-sm text-charcoal/70">Minimisation des données, consentement cookies, droits d&apos;accès et de suppression — voir docs/SECURITY.md.</p>
    </div>
  );
}
