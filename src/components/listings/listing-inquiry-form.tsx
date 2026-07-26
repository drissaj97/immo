"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  locale: string;
  listingId: string;
  listingTitle: string;
};

export function ListingInquiryForm({ locale, listingId, listingTitle }: Props) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch(`/${locale}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          contactName: data.get("name"),
          contactEmail: data.get("email"),
          contactPhone: data.get("phone"),
          message:
            (data.get("message") as string) ||
            `Bonjour, je suis intéressé(e) par « ${listingTitle} ». Merci de me recontacter.`,
          source: "listing_inquiry",
        }),
      });
      if (!res.ok) {
        setError("Envoi impossible pour le moment.");
        setLoading(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Erreur réseau. Réessayez.");
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-deep-green/25 bg-deep-green/5 p-4">
        <p className="font-medium text-deep-green">Demande envoyée</p>
        <p className="mt-1 text-sm text-charcoal/70">
          Un conseiller ou l’annonceur vous recontactera rapidement.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-charcoal/10 bg-ivory p-4">
      <h3 className="font-medium">Contacter à propos de ce bien</h3>
      <p className="text-xs text-charcoal/55">Réponse sous 24 h en semaine (mode démo : lead enregistré).</p>
      <input
        name="name"
        required
        placeholder="Nom"
        className="w-full rounded border border-charcoal/20 bg-white px-3 py-2 text-sm"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full rounded border border-charcoal/20 bg-white px-3 py-2 text-sm"
      />
      <input
        name="phone"
        placeholder="Téléphone (WhatsApp)"
        className="w-full rounded border border-charcoal/20 bg-white px-3 py-2 text-sm"
      />
      <textarea
        name="message"
        rows={3}
        placeholder="Message (optionnel)"
        className="w-full rounded border border-charcoal/20 bg-white px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Envoi…" : "Envoyer ma demande"}
      </Button>
    </form>
  );
}
