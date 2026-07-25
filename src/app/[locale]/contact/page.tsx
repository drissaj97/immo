import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Contact", description: "Contactez l'équipe Samsar IA.", path: "/contact", locale });
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Contact</h1>
      <p className="mt-4 text-charcoal/70">contact@samsar-ia.demo — adresse fictive pour la démonstration.</p>
    </div>
  );
}
