"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DonneesPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "fr";
  const [deleted, setDeleted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function requestDeletion() {
    setLoading(true);
    const res = await fetch(`/${locale}/api/account`, { method: "DELETE" });
    if (res.ok) setDeleted(true);
    setLoading(false);
  }

  async function exportData() {
    const res = await fetch(`/${locale}/api/account`);
    if (res.ok) {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "darbladi-mes-donnees.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Mes données personnelles</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>
      <p className="mt-4 text-sm text-charcoal/70">
        Exercez vos droits CNDP / RGPD : accès, portabilité et suppression.
      </p>

      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-charcoal/10 p-5">
          <h2 className="font-medium">Exporter mes données</h2>
          <p className="mt-1 text-sm text-charcoal/60">Télécharger un fichier JSON avec vos favoris et simulations.</p>
          <Button className="mt-3" size="sm" variant="outline" onClick={exportData}>
            Télécharger
          </Button>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50/50 p-5">
          <h2 className="font-medium text-red-800">Supprimer mon compte</h2>
          <p className="mt-1 text-sm text-charcoal/60">
            Action irréversible en démo — supprime la session et les données associées en mémoire.
          </p>
          {deleted ? (
            <p className="mt-3 text-sm text-deep-green">Demande enregistrée. Session fermée.</p>
          ) : (
            <Button className="mt-3" size="sm" variant="outline" onClick={requestDeletion} disabled={loading}>
              {loading ? "Traitement…" : "Demander la suppression"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
