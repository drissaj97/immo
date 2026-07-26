"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { buildSavedSearchName } from "@/lib/search/saved-search-label";

type Props = {
  locale: string;
  filters: SearchFilters;
  matchCount?: number;
};

export function SaveSearchAlertButton({ locale, filters, matchCount }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function saveAlert() {
    setStatus("loading");
    setMessage(null);
    const name = buildSavedSearchName(filters);
    try {
      const res = await fetch(`/${locale}/api/saved-searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          filters: {
            transactionType: filters.transactionType,
            region: filters.region,
            city: filters.city,
            neighborhood: filters.neighborhood,
            listingType: filters.listingType,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            bedrooms: filters.bedrooms,
          },
          alertEnabled: true,
        }),
      });

      if (res.status === 401) {
        const returnTo = encodeURIComponent(
          typeof window !== "undefined" ? window.location.pathname + window.location.search : `/${locale}/biens`,
        );
        router.push(`/${locale}/connexion?next=${returnTo}`);
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage("Impossible de créer l'alerte. Réessayez.");
        return;
      }

      setStatus("done");
      setMessage(
        matchCount != null
          ? `Alerte créée — ${matchCount.toLocaleString("fr-MA")} bien(s) suivis.`
          : "Alerte créée. Vous serez notifié des nouvelles annonces.",
      );
    } catch {
      setStatus("error");
      setMessage("Erreur réseau. Réessayez.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={saveAlert}
        disabled={status === "loading" || status === "done"}
        className="gap-2"
      >
        <Bell className="h-4 w-4" />
        {status === "done" ? "Alerte activée" : status === "loading" ? "Enregistrement…" : "Créer une alerte"}
      </Button>
      {message && (
        <p className={`text-sm ${status === "error" ? "text-red-700" : "text-deep-green"}`}>
          {message}{" "}
          {status === "done" && (
            <a href={`/${locale}/dashboard/alertes`} className="underline underline-offset-2">
              Voir mes alertes
            </a>
          )}
        </p>
      )}
    </div>
  );
}
