import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth/session";
import {
  DEMO_ORGANIZATIONS,
  DEMO_PROFESSIONALS,
  getAgencies,
} from "@/lib/data/marketplace-data";
import { buildMetadata } from "@/lib/seo/metadata";
import { listLeads } from "@/server/repositories/leads";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Espace agence",
    description: "Gestion multi-agents et vue d'ensemble agence.",
    path: "/dashboard/agence",
    locale,
  });
}

export default async function AgencePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getSession();
  if (!user) redirect(`/${locale}/connexion`);
  if (!["admin", "agent", "agency_admin"].includes(user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const agencies = getAgencies();
  const leads = await listLeads();
  const newLeads = leads.filter((l) => l.status === "new").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Espace agence</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>
      <p className="mt-4 text-charcoal/60">
        Vue multi-agents — {user.fullName} ({user.role})
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-charcoal/10 p-5">
          <p className="text-sm text-charcoal/60">Agences démo</p>
          <p className="text-2xl font-medium">{agencies.length}</p>
        </div>
        <div className="rounded-lg border border-charcoal/10 p-5">
          <p className="text-sm text-charcoal/60">Agents actifs</p>
          <p className="text-2xl font-medium">{DEMO_PROFESSIONALS.length}</p>
        </div>
        <div className="rounded-lg border border-charcoal/10 p-5">
          <p className="text-sm text-charcoal/60">Leads nouveaux</p>
          <p className="text-2xl font-medium text-deep-green">{newLeads}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-xl">Agences partenaires</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {DEMO_ORGANIZATIONS.filter((o) => o.type === "agency").map((org) => (
            <div key={org.id} className="rounded-lg border border-charcoal/10 p-5">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{org.name}</h3>
                {org.isVerified && <Badge variant="verified">Vérifié</Badge>}
              </div>
              <p className="mt-1 text-sm text-charcoal/60">{org.city}</p>
              <p className="mt-2 text-sm">{org.listingCount} annonces</p>
              <Link href={`/${locale}/professionnels/${org.slug}`} className="mt-3 inline-block text-sm text-deep-green hover:underline">
                Voir la fiche →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl">Équipe</h2>
        <ul className="mt-4 space-y-2">
          {DEMO_PROFESSIONALS.map((pro) => (
            <li key={pro.id} className="flex items-center justify-between rounded border border-charcoal/10 px-4 py-3">
              <div>
                <p className="font-medium">{pro.displayName}</p>
                <p className="text-sm text-charcoal/60">{pro.organizationName}</p>
              </div>
              {pro.isVerified && <Badge variant="verified">Vérifié</Badge>}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex gap-4">
        <Link href={`/${locale}/dashboard/leads`} className="text-deep-green hover:underline">
          Gérer les leads →
        </Link>
        <Link href={`/${locale}/dashboard/import`} className="text-deep-green hover:underline">
          Import partenaires →
        </Link>
      </div>
    </div>
  );
}
