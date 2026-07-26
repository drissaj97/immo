"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GenerateReportButton({
  listingId,
  locale,
}: {
  listingId: string;
  locale: string;
}) {
  const router = useRouter();

  return (
    <Button
      variant="bronze"
      size="sm"
      onClick={async () => {
        const res = await fetch(`/${locale}/api/investment/reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId }),
        });
        const data = await res.json();
        if (data.id) router.push(`/${locale}/dashboard/rapports/${data.id}`);
      }}
    >
      Rapport investissement
    </Button>
  );
}
