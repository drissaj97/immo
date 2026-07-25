import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Hors ligne",
    description: "Samsar IA est disponible hors connexion.",
    path: "/offline",
    locale,
  });
}

export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-serif text-3xl">Vous êtes hors ligne</h1>
      <p className="mt-4 text-charcoal/70">
        Samsar IA PWA conserve les pages récemment visitées. Reconnectez-vous pour accéder au catalogue complet.
      </p>
      <Link
        href={`/${locale}`}
        className="mt-8 rounded-lg bg-deep-green px-6 py-3 text-sm text-ivory hover:opacity-90"
      >
        Réessayer
      </Link>
    </div>
  );
}
