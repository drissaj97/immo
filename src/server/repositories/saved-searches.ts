import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { useDatabase } from "@/lib/db/repository";
import { savedSearches } from "@/lib/db/schema";
import type { SearchFilters } from "@/modules/search/natural-language-parser";

export type SavedSearchRecord = {
  id: string;
  name: string;
  filters: SearchFilters;
  alertEnabled: boolean;
  createdAt: string;
};

const demoSavedSearches = new Map<string, SavedSearchRecord[]>();

export async function listSavedSearches(userId: string): Promise<SavedSearchRecord[]> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(savedSearches)
        .where(eq(savedSearches.userId, userId))
        .orderBy(desc(savedSearches.createdAt));
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        filters: r.filters as SearchFilters,
        alertEnabled: r.alertEnabled ?? false,
        createdAt: r.createdAt.toISOString(),
      }));
    }
  }
  return demoSavedSearches.get(userId) ?? [];
}

export async function createSavedSearch(
  userId: string,
  name: string,
  filters: SearchFilters,
  alertEnabled = false,
): Promise<SavedSearchRecord> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const [row] = await db
        .insert(savedSearches)
        .values({ userId, name, filters, alertEnabled })
        .returning();
      if (row) {
        return {
          id: row.id,
          name: row.name,
          filters: row.filters as SearchFilters,
          alertEnabled: row.alertEnabled ?? false,
          createdAt: row.createdAt.toISOString(),
        };
      }
    }
  }

  const record: SavedSearchRecord = {
    id: `search-${Date.now()}`,
    name,
    filters,
    alertEnabled,
    createdAt: new Date().toISOString(),
  };
  const list = demoSavedSearches.get(userId) ?? [];
  list.unshift(record);
  demoSavedSearches.set(userId, list);
  return record;
}

export async function deleteSavedSearch(userId: string, id: string): Promise<boolean> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const result = await db
        .delete(savedSearches)
        .where(eq(savedSearches.id, id))
        .returning();
      return result.length > 0;
    }
  }
  const list = demoSavedSearches.get(userId) ?? [];
  const next = list.filter((s) => s.id !== id);
  demoSavedSearches.set(userId, next);
  return list.length !== next.length;
}

export async function setSavedSearchAlert(
  userId: string,
  id: string,
  alertEnabled: boolean,
): Promise<SavedSearchRecord | null> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .update(savedSearches)
        .set({ alertEnabled })
        .where(and(eq(savedSearches.id, id), eq(savedSearches.userId, userId)))
        .returning();
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        filters: row.filters as SearchFilters,
        alertEnabled: row.alertEnabled ?? false,
        createdAt: row.createdAt.toISOString(),
      };
    }
  }
  const list = demoSavedSearches.get(userId) ?? [];
  const item = list.find((s) => s.id === id);
  if (!item) return null;
  item.alertEnabled = alertEnabled;
  return item;
}

/** Tous les userIds ayant au moins une alerte (mode démo mémoire). */
export function listDemoUserIdsWithAlerts(): string[] {
  return Array.from(demoSavedSearches.entries())
    .filter(([, searches]) => searches.some((s) => s.alertEnabled))
    .map(([userId]) => userId);
}
