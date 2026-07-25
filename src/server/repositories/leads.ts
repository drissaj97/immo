import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { useDatabase } from "@/lib/db/repository";
import { leads } from "@/lib/db/schema";

export type LeadRecord = {
  id: string;
  listingId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  message?: string;
  status: string;
  source: string;
  createdAt: string;
  isDemo: boolean;
};

const demoLeads: LeadRecord[] = [
  {
    id: "lead-001",
    listingId: "demo-001",
    contactName: "Karim B.",
    contactEmail: "karim.demo@example.com",
    contactPhone: "+212 6 00 00 00 01",
    message: "Intéressé par une visite cette semaine.",
    status: "new",
    source: "website",
    createdAt: "2026-07-20T09:00:00Z",
    isDemo: true,
  },
  {
    id: "lead-002",
    listingId: "demo-002",
    contactName: "Sophie L.",
    contactEmail: "sophie.demo@example.com",
    message: "Demande d'informations sur la fiscalité.",
    status: "contacted",
    source: "darbladi",
    createdAt: "2026-07-18T14:30:00Z",
    isDemo: true,
  },
];

function mapLead(row: typeof leads.$inferSelect): LeadRecord {
  return {
    id: row.id,
    listingId: row.listingId ?? undefined,
    contactName: row.contactName ?? undefined,
    contactEmail: row.contactEmail ?? undefined,
    contactPhone: row.contactPhone ?? undefined,
    message: row.message ?? undefined,
    status: row.status,
    source: row.source ?? "website",
    createdAt: row.createdAt.toISOString(),
    isDemo: row.isDemo ?? true,
  };
}

export async function listLeads(organizationId?: string): Promise<LeadRecord[]> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const query = db.select().from(leads).orderBy(desc(leads.createdAt));
      const rows = organizationId
        ? await query.where(eq(leads.organizationId, organizationId))
        : await query;
      if (rows.length > 0) return rows.map(mapLead);
    }
  }
  return [...demoLeads];
}

export async function createLead(input: {
  listingId?: string;
  organizationId?: string;
  assignedToId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  message?: string;
  source?: string;
}): Promise<LeadRecord> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const [row] = await db
        .insert(leads)
        .values({
          listingId: input.listingId ?? null,
          organizationId: input.organizationId ?? null,
          assignedToId: input.assignedToId ?? null,
          contactName: input.contactName,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          message: input.message,
          source: input.source ?? "website",
          isDemo: true,
        })
        .returning();
      if (row) return mapLead(row);
    }
  }

  const lead: LeadRecord = {
    id: `lead-${Date.now()}`,
    listingId: input.listingId,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    message: input.message,
    status: "new",
    source: input.source ?? "website",
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
  demoLeads.unshift(lead);
  return lead;
}

export async function updateLeadStatus(id: string, status: string): Promise<boolean> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const result = await db.update(leads).set({ status }).where(eq(leads.id, id)).returning();
      return result.length > 0;
    }
  }
  const lead = demoLeads.find((l) => l.id === id);
  if (!lead) return false;
  lead.status = status;
  return true;
}
