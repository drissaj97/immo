"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const SAMPLE_CSV = `title,description,price,city,transactionType,listingType,livingArea,bedrooms,reference,sourceName
Appartement F3 importé,Annonce importée via CSV démo,950000,Marrakech,sale,apartment,85,2,IMP-001,Partenaire Demo
Villa importée,Villa fictive importée,4500000,Rabat,sale,villa,280,4,IMP-002,Partenaire Demo`;

export default function ImportPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "fr";
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [result, setResult] = useState<{ imported: number; listings: Array<{ title: string }> } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/${locale}/api/import/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur import");
        return;
      }
      setResult(data);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Import partenaires</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>
      <p className="mt-4 text-charcoal/60">
        Import CSV basique (max 50 lignes). Les annonces arrivent en modération.
      </p>

      <textarea
        className="mt-6 w-full rounded-lg border border-charcoal/20 p-4 font-mono text-sm"
        rows={10}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
      />

      <Button className="mt-4" onClick={handleImport} disabled={loading}>
        {loading ? "Import en cours…" : "Importer"}
      </Button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-6 rounded-lg border border-deep-green/20 bg-deep-green/5 p-4">
          <p className="font-medium">{result.imported} annonce(s) importée(s)</p>
          <ul className="mt-2 text-sm text-charcoal/70">
            {result.listings.map((l, i) => (
              <li key={i}>• {l.title}</li>
            ))}
          </ul>
          <Link href={`/${locale}/admin`} className="mt-4 inline-block text-sm text-deep-green hover:underline">
            Modérer dans l&apos;admin →
          </Link>
        </div>
      )}
    </div>
  );
}
