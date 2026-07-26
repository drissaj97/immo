import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { DepositListingForm } from "@/components/listings/deposit-listing-form";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Créer une annonce DarBladi",
    description: "Déposez une annonce first-party DarBladi.",
    path: "/dashboard/annonces/nouveau",
    locale,
  });
}

export default async function NewListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getSession();
  if (!user || !["agent", "admin", "agency_admin"].includes(user.role)) {
    redirect(`/${locale}/connexion?next=/${locale}/dashboard/annonces/nouveau`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Créer une annonce DarBladi</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Annonce first-party — badge <strong>Annonce DarBladi</strong> après validation (ou
        publication immédiate si admin).
      </p>
      <Link
        href={`/${locale}/deposer-annonce`}
        className="mt-2 inline-block text-sm text-deep-green hover:underline"
      >
        Voir la page publique « Déposer une annonce » →
      </Link>

      <div className="mt-8">
        <DepositListingForm
          locale={locale}
          variant="dashboard"
          defaultContactName={user.fullName}
          defaultContactEmail={user.email}
          allowPublishNow={user.role === "admin"}
        />
      </div>
    </div>
  );
}
