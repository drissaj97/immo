"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SearchFilters } from "@/modules/search/natural-language-parser";

export function ListingFilters({
  locale,
  current,
}: {
  locale: string;
  current: SearchFilters;
}) {
  const router = useRouter();

  return (
    <form
      className="space-y-4 rounded-lg border border-charcoal/10 bg-ivory p-4 h-fit"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        fd.forEach((v, k) => {
          if (v) params.set(k, String(v));
        });
        router.push(`/${locale}/biens?${params.toString()}`);
      }}
    >
      <h2 className="font-medium">Filtres</h2>
      <label className="block text-sm">
        Ville
        <Input name="city" defaultValue={current.city ?? ""} className="mt-1" />
      </label>
      <label className="block text-sm">
        Type
        <select name="listingType" defaultValue={current.listingType ?? ""} className="mt-1 flex h-10 w-full rounded-md border border-charcoal/15 px-3 text-sm">
          <option value="">Tous</option>
          <option value="apartment">Appartement</option>
          <option value="villa">Villa</option>
          <option value="riad">Riad</option>
          <option value="land">Terrain</option>
        </select>
      </label>
      <label className="block text-sm">
        Budget max
        <Input name="maxPrice" type="number" defaultValue={current.maxPrice ?? ""} className="mt-1" />
      </label>
      <label className="block text-sm">
        Chambres min
        <Input name="bedrooms" type="number" defaultValue={current.bedrooms ?? ""} className="mt-1" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="hasPool" value="true" defaultChecked={current.hasPool} />
        Piscine
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isVerified" value="true" defaultChecked={current.isVerified} />
        Annonce vérifiée
      </label>
      <label className="block text-sm">
        Tri
        <select name="sort" defaultValue={current.sort ?? "recent"} className="mt-1 flex h-10 w-full rounded-md border border-charcoal/15 px-3 text-sm">
          <option value="recent">Plus récents</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="area_desc">Surface décroissante</option>
        </select>
      </label>
      <Button type="submit" className="w-full">Appliquer</Button>
    </form>
  );
}
