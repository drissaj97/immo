import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getPendingListings } from "@/server/repositories/listings";
import { AdminActions } from "@/components/admin/admin-actions";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Administration", description: "Back-office de modération.", path: "/admin", locale });
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getSession();
  if (!user || user.role !== "admin") redirect(`/${locale}/connexion`);

  const pending = await getPendingListings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Administration</h1>
      <p className="mt-2 text-charcoal/60">Validation des annonces en attente</p>
      <div className="mt-8 space-y-4">
        {pending.length === 0 && <p className="text-charcoal/60">Aucune annonce en attente.</p>}
        {pending.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-lg border border-charcoal/10 p-4">
            <div>
              <p className="font-medium">{l.title}</p>
              <p className="text-sm text-charcoal/60">{l.location.city} · {l.price.toLocaleString("fr-MA")} MAD</p>
            </div>
            <AdminActions listingId={l.id} locale={locale} />
          </div>
        ))}
      </div>
      <Link href={`/${locale}/dashboard`} className="mt-8 inline-block text-sm text-deep-green hover:underline">← Dashboard</Link>
    </div>
  );
}
