import { RegisterForm } from "@/components/auth/register-form";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Inscription", description: "Créez votre compte DarBladi.", path: "/inscription", locale });
}

export default async function InscriptionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <div className="py-12"><RegisterForm locale={locale} /></div>;
}
