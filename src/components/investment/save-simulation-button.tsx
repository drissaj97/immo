"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { InvestmentInputs } from "@/modules/investment/calculations";

export function SaveSimulationButton({
  locale,
  inputs,
  listingId,
}: {
  locale: string;
  inputs: InvestmentInputs;
  listingId?: string;
}) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save() {
    const res = await fetch(`/${locale}/api/investment/simulations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Ma simulation", inputs, scenario: "central", listingId }),
    });
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <Input
        placeholder="Nom de la simulation"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="max-w-xs"
      />
      <Button variant="outline" size="sm" onClick={save} disabled={saved}>
        {saved ? "Enregistrée" : "Sauvegarder"}
      </Button>
    </div>
  );
}
