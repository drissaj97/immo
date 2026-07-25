import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Confidentialité", description: "Politique de confidentialité.", path: "/confidentialite", locale });
}

export default async function ConfidentialitePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Politique de confidentialité</h1>
      <p className="mt-4 text-sm text-charcoal/70">
        Samsar IA applique les principes de minimisation des données, consentement éclairé et droits des personnes
        conformément à la loi 09-08 (CNDP) et au RGPD pour les utilisateurs de l&apos;Union européenne.
      </p>

      <section className="mt-8 space-y-4 text-sm text-charcoal/80">
        <p>
          <strong>Données collectées :</strong> email, nom, téléphone (optionnel), favoris, simulations,
          recherches sauvegardées, messages de contact.
        </p>
        <p>
          <strong>Cookies :</strong> session (essentiel), préférences locale/devise, consentement analytics
          (optionnel avec bannière).
        </p>
        <p>
          <strong>Vos droits :</strong> accès, rectification, suppression, opposition — via{" "}
          <Link href={`/${locale}/dashboard/donnees`} className="text-deep-green hover:underline">
            espace self-service
          </Link>{" "}
          ou{" "}
          <Link href={`/${locale}/conformite`} className="text-deep-green hover:underline">
            page conformité CNDP
          </Link>
          .
        </p>
        <p>Voir aussi <code>docs/SECURITY.md</code> pour les mesures techniques.</p>
      </section>
    </div>
  );
}
