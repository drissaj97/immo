import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { investmentReports, investmentScenarios } from "@/lib/db/schema";
import type { InvestmentReport } from "@/modules/investment/report";
import type { InvestmentInputs, InvestmentResults } from "@/modules/investment/calculations";
import type { SavedSimulation } from "@/server/repositories/investment";

export async function dbSaveSimulation(
  userId: string,
  name: string,
  inputs: InvestmentInputs,
  results: InvestmentResults,
  scenario: SavedSimulation["scenario"],
  listingId?: string,
): Promise<SavedSimulation | null> {
  const db = getDb();
  if (!db) return null;

  const [row] = await db
    .insert(investmentScenarios)
    .values({
      userId,
      listingId: listingId ?? null,
      name,
      scenario,
      inputs,
      results,
      isDemo: true,
    })
    .returning();

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    listingId: row.listingId ?? undefined,
    inputs: row.inputs as InvestmentInputs,
    results: row.results as InvestmentResults,
    scenario: row.scenario as SavedSimulation["scenario"],
    createdAt: row.createdAt.toISOString(),
    isDemo: true,
  };
}

export async function dbListSimulations(userId: string): Promise<SavedSimulation[]> {
  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(investmentScenarios)
    .where(eq(investmentScenarios.userId, userId))
    .orderBy(desc(investmentScenarios.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    listingId: row.listingId ?? undefined,
    inputs: row.inputs as InvestmentInputs,
    results: row.results as InvestmentResults,
    scenario: row.scenario as SavedSimulation["scenario"],
    createdAt: row.createdAt.toISOString(),
    isDemo: true,
  }));
}

export async function dbSaveReport(
  userId: string | undefined,
  listingId: string | undefined,
  report: InvestmentReport,
): Promise<void> {
  const db = getDb();
  if (!db) return;

  await db.insert(investmentReports).values({
    userId: userId ?? null,
    listingId: listingId ?? null,
    scoreOverall: report.score.overall,
    reportData: report,
    isDemo: true,
  });
}

export async function dbGetReport(id: string): Promise<InvestmentReport | null> {
  const db = getDb();
  if (!db) return null;

  const [row] = await db
    .select()
    .from(investmentReports)
    .where(eq(investmentReports.id, id))
    .limit(1);

  if (!row) return null;
  return row.reportData as InvestmentReport;
}

export async function dbListReports(userId?: string): Promise<InvestmentReport[]> {
  const db = getDb();
  if (!db) return [];

  const query = db.select().from(investmentReports).orderBy(desc(investmentReports.generatedAt));
  const rows = userId
    ? await query.where(eq(investmentReports.userId, userId))
    : await query;

  return rows.map((r) => r.reportData as InvestmentReport);
}
