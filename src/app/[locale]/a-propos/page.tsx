import { buildMetadata } from "@/lib/seo/metadata";

function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8 prose prose-neutral">
      <h1 className="font-serif text-3xl">{title}</h1>
      <div className="mt-6 text-charcoal/80 space-y-4">{children}</div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "À propos", description: "Samsar IA — plateforme immobilière intelligente.", path: "/a-propos", locale });
}

export default function AProposPage() {
  return (
    <StaticPage title="À propos de Samsar IA">
      <p>Samsar IA est la plateforme marocaine qui permet de rechercher, comprendre, comparer et sécuriser une décision immobilière grâce aux données et à l&apos;intelligence artificielle.</p>
      <p>Ce MVP présente des données entièrement fictives clairement identifiées comme démonstration.</p>
    </StaticPage>
  );
}
