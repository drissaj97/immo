import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth/session";
import { SUBSCRIPTION_PLANS, getPlanById } from "@/lib/data/plans";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSubscription, listPayments } from "@/server/repositories/payments";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Facturation",
    description: "Abonnement et historique de paiements.",
    path: "/dashboard/facturation",
    locale,
  });
}

export default async function FacturationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ subscribed?: string }>;
}) {
  const { locale } = await params;
  const { subscribed } = await searchParams;
  const user = await getSession();
  if (!user) redirect(`/${locale}/connexion`);

  const subscription = getSubscription(user.id);
  const payments = listPayments(user.id);
  const activePlan = subscription ? getPlanById(subscription.planId) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Facturation</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>

      {subscribed && (
        <p className="mt-4 rounded-lg border border-deep-green/20 bg-deep-green/5 p-4 text-sm text-deep-green">
          Abonnement activé (démo) — plan {subscribed}.
        </p>
      )}

      <section className="mt-8 rounded-lg border border-charcoal/10 p-6">
        <h2 className="font-serif text-xl">Abonnement actuel</h2>
        {activePlan ? (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">{activePlan.name}</p>
              <Badge variant="verified">Actif</Badge>
            </div>
            <p className="mt-1 text-charcoal/60">
              {formatPrice(activePlan.priceMonthly, "MAD")}/mois · Renouvellement{" "}
              {subscription?.renewsAt ? new Date(subscription.renewsAt).toLocaleDateString("fr-MA") : "—"}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-charcoal/60">
            Plan Gratuit.{" "}
            <Link href={`/${locale}/tarifs`} className="text-deep-green hover:underline">
              Voir les offres →
            </Link>
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Historique des paiements</h2>
        {payments.length === 0 ? (
          <p className="mt-4 text-charcoal/60">Aucun paiement enregistré.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between rounded border border-charcoal/10 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{p.type === "deposit" ? "Acompte réservation" : "Abonnement"}</p>
                  <p className="text-charcoal/60">{new Date(p.createdAt).toLocaleDateString("fr-MA")} · {p.provider}</p>
                </div>
                <div className="text-right">
                  <p>{formatPrice(p.amount, "MAD")}</p>
                  <Badge variant={p.status === "completed" ? "verified" : "warning"}>{p.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-xs text-charcoal/40">
        Paiements simulés — configurez PAYMENT_PROVIDER=stripe + STRIPE_SECRET_KEY en production.
      </p>
    </div>
  );
}
