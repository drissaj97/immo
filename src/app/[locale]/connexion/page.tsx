import { LoginForm } from "@/components/auth/login-form";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Connexion", description: "Connectez-vous à DarBladi.", path: "/connexion", locale });
}

export default async function ConnexionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="py-12">
      <LoginForm locale={locale} />
    </div>
  );
}
