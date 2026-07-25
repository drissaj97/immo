"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Home, Search, RotateCcw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "darbladi-last-search";

const POPULAR_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tanger",
  "Agadir",
  "Fès",
  "Salé",
  "Meknès",
  "Oujda",
  "Kénitra",
  "Tétouan",
  "Nador",
];

type SavedSearch = {
  transactionType: "sale" | "long_term_rent";
  city: string;
  listingType: string;
  minPrice: string;
  maxPrice: string;
};

type PropertySearchProps = {
  locale: string;
  variant?: "hero" | "compact";
  defaultTransaction?: "sale" | "long_term_rent";
  initial?: Partial<SavedSearch>;
};

export function PropertySearch({
  locale,
  variant = "hero",
  defaultTransaction = "sale",
  initial,
}: PropertySearchProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"sale" | "long_term_rent">(
    initial?.transactionType ?? defaultTransaction,
  );
  const [city, setCity] = useState(initial?.city ?? "");
  const [listingType, setListingType] = useState(initial?.listingType ?? "");
  const [minPrice, setMinPrice] = useState(initial?.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initial?.maxPrice ?? "");
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    try {
      setHasSaved(Boolean(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setHasSaved(false);
    }
  }, []);

  function buildParams(): URLSearchParams {
    const params = new URLSearchParams();
    params.set("transactionType", tab);
    if (city.trim()) params.set("city", city.trim());
    if (listingType) params.set("listingType", listingType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return params;
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const params = buildParams();
    const saved: SavedSearch = {
      transactionType: tab,
      city,
      listingType,
      minPrice,
      maxPrice,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setHasSaved(true);
    } catch {
      /* ignore */
    }
    router.push(`/${locale}/biens?${params.toString()}`);
  }

  function handleReset() {
    setCity("");
    setListingType("");
    setMinPrice("");
    setMaxPrice("");
    setTab("sale");
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasSaved(false);
    } catch {
      /* ignore */
    }
  }

  function handleResume() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedSearch;
      setTab(saved.transactionType ?? "sale");
      setCity(saved.city ?? "");
      setListingType(saved.listingType ?? "");
      setMinPrice(saved.minPrice ?? "");
      setMaxPrice(saved.maxPrice ?? "");
    } catch {
      /* ignore */
    }
  }

  const isHero = variant === "hero";

  return (
    <div
      className={
        isHero
          ? "rounded-2xl border border-charcoal/10 bg-ivory p-6 shadow-xl md:p-8"
          : "rounded-xl border border-charcoal/10 bg-ivory p-4"
      }
    >
      <div className="mb-6 flex flex-wrap gap-2 border-b border-charcoal/10 pb-4">
        <button
          type="button"
          onClick={() => setTab("sale")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "sale"
              ? "bg-deep-green text-ivory"
              : "text-charcoal/70 hover:bg-sand/60"
          }`}
        >
          <Home className="h-4 w-4" />
          Acheter
        </button>
        <button
          type="button"
          onClick={() => setTab("long_term_rent")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "long_term_rent"
              ? "bg-deep-green text-ivory"
              : "text-charcoal/70 hover:bg-sand/60"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Louer
        </button>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 rounded-lg border border-charcoal/15 px-3 py-2 text-xs text-charcoal/70 hover:border-deep-green/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Nouvelle recherche
          </button>
          {hasSaved && (
            <button
              type="button"
              onClick={handleResume}
              className="flex items-center gap-1 rounded-lg border border-deep-green/30 bg-deep-green/5 px-3 py-2 text-xs text-deep-green hover:bg-deep-green/10"
            >
              <History className="h-3.5 w-3.5" />
              Reprendre
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-charcoal/60">
            <MapPin className="h-3.5 w-3.5" />
            Ville
          </label>
          <Input
            list="darbladi-cities"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Casablanca, Marrakech, Rabat…"
            className="h-11"
          />
          <datalist id="darbladi-cities">
            {POPULAR_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-charcoal/60">
            <Home className="h-3.5 w-3.5" />
            Type de bien
          </label>
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            className="flex h-11 w-full rounded-md border border-charcoal/15 bg-ivory px-3 text-sm"
          >
            <option value="">Tous les types</option>
            <option value="apartment">Appartement</option>
            <option value="villa">Villa</option>
            <option value="riad">Riad</option>
            <option value="land">Terrain</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 text-xs font-medium uppercase tracking-wide text-charcoal/60">
            Budget (MAD)
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min"
              className="h-11"
            />
            <Input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="h-11"
            />
          </div>
        </div>

        <div className="md:col-span-2 lg:col-span-4">
          <Button type="submit" className="h-12 w-full gap-2 text-base" variant="default">
            <Search className="h-5 w-5" />
            Rechercher dans tout le Maroc
          </Button>
        </div>
      </form>
    </div>
  );
}
