import { notFound } from "next/navigation";
import { getInvestmentReport } from "@/server/repositories/investment";
import { InvestmentReportView } from "@/components/investment/investment-report-view";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Rapport d'investissement",
    description: "Analyse détaillée et score transparent.",
    path: "/dashboard/rapports",
    locale,
  });
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const report = await getInvestmentReport(id);
  if (!report) notFound();

  return <InvestmentReportView report={report} locale={locale} />;
}
