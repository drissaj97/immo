import { redirect } from "next/navigation";

/** Redirection legacy /darbladi → /samsar-ia */
export default async function LegacyDarbladiRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/samsar-ia`);
}
