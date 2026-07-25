"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type ParsedResult = {
  filters: Record<string, unknown>;
  assumptions: string[];
  missing: string[];
};

export function ConversationalSearch({ locale }: { locale: string }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const router = useRouter();

  async function handleSearch() {
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/search/conversational`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    if (!result) return;
    const params = new URLSearchParams();
    Object.entries(result.filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    router.push(`/${locale}/biens?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Décrivez votre recherche en langage naturel…"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Analyse…" : "Analyser"}
        </Button>
      </div>

      {result && (
        <div className="rounded-lg border border-charcoal/10 bg-sand/30 p-4 space-y-3">
          <p className="text-sm font-medium">Critères compris</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(result.filters).map(([k, v]) => (
              <Badge key={k}>
                {k}: {String(v)}
              </Badge>
            ))}
          </div>
          {result.assumptions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-charcoal/60">Hypothèses</p>
              <ul className="text-sm text-charcoal/80 list-disc pl-4">
                {result.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {result.missing.length > 0 && (
            <div>
              <p className="text-xs font-medium text-bronze">Informations manquantes</p>
              <ul className="text-sm list-disc pl-4">
                {result.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <Badge variant="demo">Mode démonstration — parseur local sans clé IA</Badge>
          <Button onClick={applyFilters}>Voir les résultats</Button>
        </div>
      )}
    </div>
  );
}
