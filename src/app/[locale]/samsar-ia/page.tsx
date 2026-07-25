import { redirect } from "next/navigation";

/** Redirection legacy /samsar-ia → /darbladi */
export default async function LegacySamsarRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/darbladi`);
}
