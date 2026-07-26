"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminActions({ listingId, locale }: { listingId: string; locale: string }) {
  const router = useRouter();

  async function act(action: "approve" | "reject") {
    await fetch(`/${locale}/api/admin/listings/${listingId}/${action}`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => act("approve")}>Valider</Button>
      <Button size="sm" variant="outline" onClick={() => act("reject")}>Rejeter</Button>
    </div>
  );
}
