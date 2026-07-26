"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Lead = {
  id: string;
  listingId?: string;
  contactName?: string;
  contactEmail?: string;
  message?: string;
  status: string;
  source: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  closed: "Clôturé",
};

export default function LeadsPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "fr";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/${locale}/api/leads`);
      if (res.ok) {
        const data = (await res.json()) as { leads: Lead[] };
        setLeads(data.leads);
      }
      setLoading(false);
    }
    void load();
  }, [locale]);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/${locale}/api/leads`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Leads CRM</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>
      <p className="mt-4 text-charcoal/60">
        Demandes de contact (fiche bien, formulaire contact). Les leads démo restent visibles.
      </p>

      {loading ? (
        <p className="mt-8 text-charcoal/60">Chargement…</p>
      ) : leads.length === 0 ? (
        <p className="mt-8 text-charcoal/60">Aucun lead pour le moment.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-charcoal/10">
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Bien</th>
                <th className="py-3 pr-4">Message</th>
                <th className="py-3 pr-4">Source</th>
                <th className="py-3 pr-4">Statut</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-charcoal/5">
                  <td className="py-4 pr-4">
                    <p className="font-medium">{lead.contactName ?? "—"}</p>
                    <p className="text-charcoal/60">{lead.contactEmail}</p>
                  </td>
                  <td className="py-4 pr-4 font-mono text-xs text-charcoal/55">
                    {lead.listingId ? lead.listingId.slice(0, 16) : "—"}
                  </td>
                  <td className="max-w-xs py-4 pr-4 truncate text-charcoal/70">{lead.message}</td>
                  <td className="py-4 pr-4">{lead.source}</td>
                  <td className="py-4 pr-4">{STATUS_LABELS[lead.status] ?? lead.status}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      {["contacted", "qualified", "closed"].map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(lead.id, s)}
                          disabled={lead.status === s}
                        >
                          {STATUS_LABELS[s]}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
