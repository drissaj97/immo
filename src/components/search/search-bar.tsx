"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar({
  locale,
  defaultTransaction = "sale",
}: {
  locale: string;
  placeholder?: string;
  defaultTransaction?: string;
}) {
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-charcoal/10 bg-ivory/95 p-4 shadow-lg backdrop-blur md:flex-row md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        const city = fd.get("city") as string;
        const type = fd.get("type") as string;
        const maxPrice = fd.get("maxPrice") as string;
        if (city) params.set("city", city);
        if (type) params.set("listingType", type);
        if (maxPrice) params.set("maxPrice", maxPrice);
        params.set("transactionType", defaultTransaction);
        router.push(`/${locale}/biens?${params.toString()}`);
      }}
    >
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-charcoal/60">Ville</label>
        <Input name="city" placeholder="Marrakech, Rabat, Salé…" />
      </div>
      <div className="w-full md:w-40">
        <label className="mb-1 block text-xs font-medium text-charcoal/60">Type</label>
        <select
          name="type"
          className="flex h-10 w-full rounded-md border border-charcoal/15 bg-ivory px-3 text-sm"
        >
          <option value="">Tous</option>
          <option value="apartment">Appartement</option>
          <option value="villa">Villa</option>
          <option value="riad">Riad</option>
          <option value="land">Terrain</option>
        </select>
      </div>
      <div className="w-full md:w-44">
        <label className="mb-1 block text-xs font-medium text-charcoal/60">Budget max (MAD)</label>
        <Input name="maxPrice" type="number" placeholder="3 000 000" />
      </div>
      <Button type="submit" className="md:mb-0">
        <Search className="h-4 w-4" />
        Rechercher
      </Button>
    </form>
  );
}
