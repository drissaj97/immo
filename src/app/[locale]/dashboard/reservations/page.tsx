import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";
import { listPayments } from "@/server/repositories/payments";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Mes réservations",
    description: "Acomptes et réservations en cours.",
    path: "/dashboard/reservations",
    locale,
  });
}

export default async function ReservationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getSession();
  if (!user) redirect(`/${locale}/connexion`);

  const reservations = listPayments(user.id).filter((p) => p.type === "deposit");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Mes réservations</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>

      {reservations.length === 0 ? (
        <p className="mt-8 text-charcoal/60">
          Aucune réservation.{" "}
          <Link href={`/${locale}/biens`} className="text-deep-green hover:underline">
            Parcourir les biens
          </Link>
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {reservations.map((r) => (
            <li key={r.id} className="rounded-lg border border-charcoal/10 p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium">Acompte bien {r.listingId}</p>
                <Badge variant="verified">{r.status}</Badge>
              </div>
              <p className="mt-2 text-deep-green">{formatPrice(r.amount, "MAD")}</p>
              <p className="mt-1 text-xs text-charcoal/50">
                {new Date(r.createdAt).toLocaleString("fr-MA")} · Réf. {r.paymentId}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
