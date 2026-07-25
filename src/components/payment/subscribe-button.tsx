"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PlanId } from "@/lib/data/plans";
import { formatPrice } from "@/lib/utils";

export function SubscribeButton({
  planId,
  planName,
  priceMonthly,
  locale,
  variant = "default",
}: {
  planId: PlanId;
  planName: string;
  priceMonthly: number;
  locale: string;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    if (planId === "free") {
      router.push(`/${locale}/inscription`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/billing/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      if (res.ok) {
        router.push(`/${locale}/dashboard/facturation?subscribed=${planId}`);
      } else if (res.status === 401) {
        router.push(`/${locale}/connexion`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} className="w-full" onClick={subscribe} disabled={loading}>
      {loading
        ? "Traitement…"
        : priceMonthly === 0
          ? "Commencer gratuitement"
          : `S'abonner — ${formatPrice(priceMonthly, "MAD")}/mois`}
    </Button>
  );
}
