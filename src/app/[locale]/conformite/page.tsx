import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Conformité CNDP",
    description: "Protection des données personnelles — Loi 09-08 Maroc.",
    path: "/conformite",
    locale,
  });
}

export default async function ConformitePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Conformité CNDP — Loi 09-08</h1>
      <p className="mt-4 text-charcoal/70">
        Samsar IA s&apos;engage à respecter la loi marocaine n° 09-08 relative à la protection des personnes
        physiques à l&apos;égard du traitement des données à caractère personnel.
      </p>

      <section className="mt-10 space-y-8 text-sm text-charcoal/80">
        <div>
          <h2 className="font-serif text-lg text-charcoal">Responsable du traitement</h2>
          <p className="mt-2">Samsar IA — démo MVP (éditeur fictif pour démonstration)</p>
          <p>Contact DPO : dpo@samsar.demo</p>
        </div>

        <div>
          <h2 className="font-serif text-lg text-charcoal">Finalités des traitements</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Création et gestion de compte utilisateur</li>
            <li>Publication et modération d&apos;annonces immobilières</li>
            <li>Gestion des favoris, simulations et alertes recherche</li>
            <li>Traitement des demandes de contact (leads CRM)</li>
            <li>Assistant IA conversationnel (requêtes anonymisées en production)</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-lg text-charcoal">Base légale</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Exécution du contrat (compte, services demandés)</li>
            <li>Consentement (cookies non essentiels, alertes email)</li>
            <li>Intérêt légitime (sécurité, amélioration du service)</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-lg text-charcoal">Durée de conservation</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Compte actif : durée de la relation contractuelle</li>
            <li>Leads : 24 mois maximum après dernier contact</li>
            <li>Logs techniques : 12 mois</li>
            <li>Données démo : sans valeur juridique, supprimables à tout moment</li>
          </ul>
        </div>

        <div>
          <h2 className="font-serif text-lg text-charcoal">Vos droits</h2>
          <p className="mt-2">Conformément à la loi 09-08, vous disposez des droits suivants :</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Droit d&apos;accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit d&apos;opposition pour motifs légitimes</li>
            <li>Droit de suppression (effacement)</li>
          </ul>
          <p className="mt-3">
            Exercer vos droits :{" "}
            <Link href={`/${locale}/contact`} className="text-deep-green hover:underline">
              formulaire de contact
            </Link>{" "}
            ou{" "}
            <Link href={`/${locale}/dashboard/donnees`} className="text-deep-green hover:underline">
              espace self-service
            </Link>
            .
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg text-charcoal">Transferts et sous-traitants</h2>
          <p className="mt-2">
            En production, les données pourraient être hébergées au Maroc ou dans l&apos;UE. Tout sous-traitant
            (hébergeur, email, LLM) fera l&apos;objet d&apos;un contrat conforme. Voir{" "}
            <Link href={`/${locale}/confidentialite`} className="text-deep-green hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg text-charcoal">Déclaration CNDP</h2>
          <p className="mt-2">
            Une déclaration ou autorisation auprès de la CNDP (Commission Nationale de contrôle de la protection
            des Données à caractère Personnel) sera déposée avant mise en production avec traitement de données
            réelles. Référence démo : non applicable (données fictives).
          </p>
        </div>

        <div>
          <h2 className="font-serif text-lg text-charcoal">Sources de données immobilières</h2>
          <p className="mt-2">
            Aucun scraping de portails tiers. Provenance explicite sur chaque annonce. Voir la documentation
            technique interne <code>docs/DATA_SOURCES_AND_COMPLIANCE.md</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
