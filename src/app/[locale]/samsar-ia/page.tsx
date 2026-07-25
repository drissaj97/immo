import { SamsarAssistant } from "@/components/ai/samsar-assistant";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Samsar IA — Assistant immobilier",
    description:
      "Assistant conversationnel Samsar IA pour rechercher et comprendre l'immobilier au Maroc.",
    path: "/samsar-ia",
    locale,
  });
}

export default async function SamsarIAPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Samsar IA</h1>
      <p className="mt-2 text-charcoal/60">
        Votre assistant immobilier conversationnel. Outils contrôlés, citations des sources, mode démo sans clé API.
      </p>
      <div className="mt-8">
        <SamsarAssistant locale={locale} />
      </div>
    </div>
  );
}
