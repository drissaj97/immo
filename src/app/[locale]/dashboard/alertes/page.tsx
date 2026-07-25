"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type SavedSearch = {
  id: string;
  name: string;
  alertEnabled: boolean;
  createdAt: string;
  filters: Record<string, unknown>;
};

export default function AlertesPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "fr";
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [name, setName] = useState("Appartements Marrakech");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/${locale}/api/saved-searches`);
      if (res.ok) {
        const data = (await res.json()) as { searches: SavedSearch[] };
        setSearches(data.searches);
      }
      setLoading(false);
    }
    void load();
  }, [locale]);

  async function createSearch() {
    const res = await fetch(`/${locale}/api/saved-searches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        filters: { city: "Marrakech", transactionType: "sale" },
        alertEnabled: true,
      }),
    });
    if (res.ok) {
      const search = (await res.json()) as SavedSearch;
      setSearches((prev) => [search, ...prev]);
    }
  }

  async function removeSearch(id: string) {
    const res = await fetch(`/${locale}/api/saved-searches?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setSearches((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Alertes & recherches sauvegardées</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>

      <div className="mt-8 rounded-lg border border-charcoal/10 p-4">
        <label className="text-sm font-medium">Nouvelle alerte</label>
        <input
          className="mt-2 w-full rounded border border-charcoal/20 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button className="mt-3" size="sm" onClick={createSearch}>
          Créer une alerte démo
        </Button>
      </div>

      {loading ? (
        <p className="mt-8 text-charcoal/60">Chargement…</p>
      ) : searches.length === 0 ? (
        <p className="mt-8 text-charcoal/60">Aucune recherche sauvegardée.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {searches.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg border border-charcoal/10 p-4">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-charcoal/60">
                  {s.alertEnabled ? "Alerte activée" : "Sans alerte"} ·{" "}
                  {new Date(s.createdAt).toLocaleDateString("fr-MA")}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => removeSearch(s.id)}>
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
