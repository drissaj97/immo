"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BillingPortalButton({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/billing/portal`, { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        alert(data.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={openPortal} disabled={loading} className="mt-4">
      {loading ? "Chargement…" : "Gérer l'abonnement (Stripe Portal)"}
    </Button>
  );
}
