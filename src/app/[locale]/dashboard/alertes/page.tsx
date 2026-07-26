"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatFiltersSummary,
  resultsPathForFilters,
} from "@/lib/search/saved-search-label";
import type { SearchFilters } from "@/modules/search/natural-language-parser";

type SavedSearch = {
  id: string;
  name: string;
  alertEnabled: boolean;
  createdAt: string;
  filters: SearchFilters;
};

export default function AlertesPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "fr";
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/${locale}/api/saved-searches`);
      if (res.status === 401) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { searches: SavedSearch[] };
        setSearches(data.searches);
      }
      setLoading(false);
    }
    void load();
  }, [locale]);

  async function toggleAlert(id: string, alertEnabled: boolean) {
    const res = await fetch(`/${locale}/api/saved-searches`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, alertEnabled }),
    });
    if (res.ok) {
      const updated = (await res.json()) as SavedSearch;
      setSearches((prev) => prev.map((s) => (s.id === id ? updated : s)));
    }
  }

  async function removeSearch(id: string) {
    const res = await fetch(`/${locale}/api/saved-searches?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setSearches((prev) => prev.filter((s) => s.id !== id));
    }
  }

  if (unauthorized) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <h1 className="font-serif text-3xl">Alertes</h1>
        <p className="mt-4 text-charcoal/60">
          Connectez-vous pour gérer vos alertes.{" "}
          <Link href={`/${locale}/connexion?next=/${locale}/dashboard/alertes`} className="text-deep-green underline">
            Se connecter
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Alertes & recherches sauvegardées</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>
      <p className="mt-4 text-sm text-charcoal/60">
        Créez une alerte depuis une page de résultats (Acheter / Louer) via « Créer une alerte ».
      </p>

      {loading ? (
        <p className="mt-8 text-charcoal/60">Chargement…</p>
      ) : searches.length === 0 ? (
        <div className="mt-8 rounded-lg border border-charcoal/10 p-6 text-center">
          <p className="text-charcoal/60">Aucune alerte pour le moment.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href={`/${locale}/acheter`}>
              <Button size="sm">Rechercher à acheter</Button>
            </Link>
            <Link href={`/${locale}/louer`}>
              <Button size="sm" variant="outline">
                Rechercher à louer
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {searches.map((s) => (
            <li key={s.id} className="rounded-lg border border-charcoal/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="mt-1 text-sm text-charcoal/60">{formatFiltersSummary(s.filters)}</p>
                  <p className="mt-1 text-xs text-charcoal/45">
                    {s.alertEnabled ? "Alerte email activée" : "Sans notification"} ·{" "}
                    {new Date(s.createdAt).toLocaleDateString("fr-MA")}
                  </p>
                  <Link
                    href={resultsPathForFilters(locale, s.filters)}
                    className="mt-2 inline-block text-sm text-deep-green hover:underline"
                  >
                    Voir les résultats →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAlert(s.id, !s.alertEnabled)}
                    className="gap-1"
                  >
                    {s.alertEnabled ? (
                      <>
                        <BellOff className="h-3.5 w-3.5" /> Couper
                      </>
                    ) : (
                      <>
                        <Bell className="h-3.5 w-3.5" /> Activer
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => removeSearch(s.id)}>
                    Supprimer
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
