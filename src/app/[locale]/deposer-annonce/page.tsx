import Link from "next/link";
import { DepositListingForm } from "@/components/listings/deposit-listing-form";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSession } from "@/lib/auth/session";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Déposer une annonce",
    description:
      "Déposez gratuitement votre annonce immobilière sur DarBladi — vente ou location au Maroc.",
    path: "/deposer-annonce",
    locale,
  });
}

export default async function DeposerAnnoncePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getSession();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      <p className="text-sm font-medium uppercase tracking-wide text-deep-green">DarBladi</p>
      <h1 className="mt-2 font-serif text-3xl md:text-4xl">Déposer une annonce</h1>
      <p className="mt-3 max-w-2xl text-charcoal/70">
        Comme sur SemsarAI, publiez gratuitement votre bien. Les annonces validées apparaissent dans
        le catalogue avec le badge <strong>Annonce DarBladi</strong> — pas comme une source Avito ou
        Mubawab.
      </p>

      <ul className="mt-6 grid gap-3 text-sm text-charcoal/75 sm:grid-cols-3">
        <li className="rounded-lg border border-charcoal/10 bg-sand/30 px-3 py-3">
          1. Remplissez le formulaire
        </li>
        <li className="rounded-lg border border-charcoal/10 bg-sand/30 px-3 py-3">
          2. Validation DarBladi
        </li>
        <li className="rounded-lg border border-charcoal/10 bg-sand/30 px-3 py-3">
          3. Visible en recherche
        </li>
      </ul>

      <div className="mt-10 rounded-xl border border-charcoal/10 bg-ivory p-6 shadow-sm">
        <DepositListingForm
          locale={locale}
          variant="public"
          defaultContactName={user?.fullName ?? ""}
          defaultContactEmail={user?.email ?? ""}
          allowPublishNow={user?.role === "admin"}
        />
      </div>

      <p className="mt-6 text-sm text-charcoal/55">
        Professionnel ?{" "}
        <Link href={`/${locale}/dashboard/annonces/nouveau`} className="text-deep-green underline">
          Espace agent
        </Link>{" "}
        ·{" "}
        <Link href={`/${locale}/connexion`} className="text-deep-green underline">
          Connexion
        </Link>
      </p>
    </div>
  );
}
