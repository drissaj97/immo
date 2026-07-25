import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Tableau de bord", description: "Votre espace personnel.", path: "/dashboard", locale });
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getSession();
  if (!user) redirect(`/${locale}/connexion`);

  const links = [
    { href: `/${locale}/dashboard/favoris`, label: "Favoris" },
    { href: `/${locale}/dashboard/alertes`, label: "Alertes" },
    { href: `/${locale}/dashboard/donnees`, label: "Mes données (CNDP)" },
    { href: `/${locale}/dashboard/analytics`, label: "Analytics investisseur" },
    { href: `/${locale}/comparer`, label: "Comparateur" },
    { href: `/${locale}/dashboard/simulations`, label: "Simulations & rapports" },
    { href: `/${locale}/simulateur-rentabilite`, label: "Simulateur" },
    { href: `/${locale}/estimation`, label: "Estimation" },
    { href: `/${locale}/investir`, label: "Hub investisseur" },
    { href: `/${locale}/darbladi`, label: "Conversations IA" },
  ];

  if (user.role === "agent" || user.role === "admin" || user.role === "agency_admin") {
    links.push(
      { href: `/${locale}/dashboard/agence`, label: "Espace agence" },
      { href: `/${locale}/dashboard/annonces/nouveau`, label: "Créer une annonce" },
      { href: `/${locale}/dashboard/leads`, label: "Leads CRM" },
      { href: `/${locale}/dashboard/import`, label: "Import partenaires" },
    );
  }
  if (user.role === "admin") {
    links.push({ href: `/${locale}/admin`, label: "Administration" });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Bonjour, {user.fullName}</h1>
      <p className="mt-2 text-charcoal/60">Rôle : {user.role}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg border border-charcoal/10 p-6 hover:border-deep-green/30">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
