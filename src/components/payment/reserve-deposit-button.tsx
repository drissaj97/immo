"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { calculateDepositAmount } from "@/lib/data/plans";
import { formatPrice } from "@/lib/utils";

export function ReserveDepositButton({
  listingId,
  listingTitle,
  price,
  locale,
}: {
  listingId: string;
  listingTitle: string;
  price: number;
  locale: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const deposit = calculateDepositAmount(price);

  async function handleReserve() {
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/payments/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, listingTitle, price }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-deep-green/30 bg-deep-green/5 p-4 text-sm text-deep-green">
        Acompte enregistré (démo). Consultez vos réservations dans le dashboard.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-charcoal/10 p-4">
      <p className="text-sm font-medium">Réserver avec acompte</p>
      <p className="mt-1 text-xs text-charcoal/60">
        Acompte indicatif : {formatPrice(deposit, "MAD")} (5 %, démo — aucun prélèvement réel)
      </p>
      <Button className="mt-3 w-full" onClick={handleReserve} disabled={loading}>
        {loading ? "Traitement…" : `Payer ${formatPrice(deposit, "MAD")}`}
      </Button>
    </div>
  );
}
