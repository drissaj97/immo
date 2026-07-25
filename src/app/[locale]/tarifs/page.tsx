import { buildMetadata } from "@/lib/seo/metadata";
import { SUBSCRIPTION_PLANS } from "@/lib/data/plans";
import { SubscribeButton } from "@/components/payment/subscribe-button";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Tarifs", description: "Offres Samsar IA pour particuliers et professionnels.", path: "/tarifs", locale });
}

export default async function TarifsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Tarifs</h1>
      <p className="mt-4 max-w-2xl text-charcoal/70">
        Offres pour investisseurs et professionnels. Paiements simulés en mode démo — aucun prélèvement réel.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {SUBSCRIPTION_PLANS.map((plan, i) => (
          <div
            key={plan.id}
            className={`flex flex-col rounded-lg border p-6 ${
              plan.id === "pro" ? "border-deep-green/40 shadow-md" : "border-charcoal/10"
            }`}
          >
            {plan.id === "pro" && (
              <span className="mb-2 text-xs font-medium uppercase text-deep-green">Populaire</span>
            )}
            <h2 className="font-serif text-xl">{plan.name}</h2>
            <p className="mt-2 text-2xl font-medium text-deep-green">
              {plan.priceMonthly === 0 ? "Gratuit" : `${formatPrice(plan.priceMonthly, "MAD")}/mois`}
            </p>
            <p className="mt-2 flex-1 text-sm text-charcoal/60">{plan.description}</p>
            <ul className="mt-4 space-y-1 text-sm text-charcoal/70">
              {plan.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <div className="mt-6">
              <SubscribeButton
                planId={plan.id}
                planName={plan.name}
                priceMonthly={plan.priceMonthly}
                locale={locale}
                variant={i === 2 ? "default" : "outline"}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-charcoal/40">
        TVA non applicable en démo. Résiliation possible à tout moment. Voir{" "}
        <a href={`/${locale}/conditions`} className="text-deep-green hover:underline">
          conditions générales
        </a>
        .
      </p>
    </div>
  );
}
