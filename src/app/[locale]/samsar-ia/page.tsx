import { ConversationalSearch } from "@/components/ai/conversational-search";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Samsar IA", description: "Assistant immobilier conversationnel.", path: "/samsar-ia", locale });
}

export default async function SamsarIaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Samsar IA</h1>
      <p className="mt-2 text-charcoal/60">
        Décrivez votre projet en langage naturel. Sans clé API, un parseur local interprète vos critères.
      </p>
      <div className="mt-8">
        <ConversationalSearch locale={locale} />
      </div>
    </div>
  );
}
