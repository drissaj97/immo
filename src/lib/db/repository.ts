import { getDb, isDatabaseConfigured } from "@/lib/db";

export function useDatabase(): boolean {
  return isDatabaseConfigured() && process.env.DEMO_MODE !== "true";
}

export async function withDb<T>(fn: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>): Promise<T | null> {
  if (!useDatabase()) return null;
  const db = getDb();
  if (!db) return null;
  return fn(db);
}
