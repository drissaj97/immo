"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Home, Search, RotateCcw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { GeographySearchTree } from "@/lib/geography/search-tree";

const STORAGE_KEY = "darbladi-last-search";

type SavedSearch = {
  transactionType: "sale" | "long_term_rent";
  region: string;
  city: string;
  neighborhood: string;
  listingType: string;
  minPrice: string;
  maxPrice: string;
};

type PropertySearchProps = {
  locale: string;
  variant?: "hero" | "compact";
  defaultTransaction?: "sale" | "long_term_rent";
  initial?: Partial<SavedSearch>;
  geography?: GeographySearchTree;
  /** Exiger région + ville + quartier avant recherche. */
  requireLocation?: boolean;
  /** Page de résultats (défaut: /biens). */
  searchPath?: string;
};

const selectClassName =
  "h-11 text-charcoal disabled:text-charcoal/40";

export function PropertySearch({
  locale,
  variant = "hero",
  defaultTransaction = "sale",
  initial,
  geography,
  requireLocation = true,
  searchPath,
}: PropertySearchProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"sale" | "long_term_rent">(
    initial?.transactionType ?? defaultTransaction,
  );
  const [region, setRegion] = useState(initial?.region ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood ?? "");
  const [listingType, setListingType] = useState(initial?.listingType ?? "");
  const [minPrice, setMinPrice] = useState(initial?.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initial?.maxPrice ?? "");
  const [hasSaved, setHasSaved] = useState(false);

  // Resync si l’URL / les props serveur changent (App Router garde sinon le state client).
  useEffect(() => {
    if (initial?.transactionType) setTab(initial.transactionType);
    if (initial?.region != null) setRegion(initial.region);
    if (initial?.city != null) setCity(initial.city);
    if (initial?.neighborhood != null) setNeighborhood(initial.neighborhood);
    if (initial?.listingType != null) setListingType(initial.listingType);
    if (initial?.minPrice != null) setMinPrice(initial.minPrice);
    if (initial?.maxPrice != null) setMaxPrice(initial.maxPrice);
  }, [
    initial?.transactionType,
    initial?.region,
    initial?.city,
    initial?.neighborhood,
    initial?.listingType,
    initial?.minPrice,
    initial?.maxPrice,
  ]);

  const regions = geography?.regions ?? [];

  const selectedRegion = useMemo(
    () => regions.find((r) => r.name === region || r.slug === region),
    [regions, region],
  );

  const cities = selectedRegion?.cities ?? [];

  const selectedCity = useMemo(
    () => cities.find((c) => c.name === city || c.slug === city),
    [cities, city],
  );

  const neighborhoods = selectedCity?.neighborhoods ?? [];

  useEffect(() => {
    try {
      setHasSaved(Boolean(localStorage.getItem(STORAGE_KEY)));
    } catch {
      setHasSaved(false);
    }
  }, []);

  function buildParams(nextTab: "sale" | "long_term_rent" = tab): URLSearchParams {
    const params = new URLSearchParams();
    params.set("transactionType", nextTab);
    if (region) params.set("region", region);
    if (city) params.set("city", city);
    if (neighborhood) params.set("neighborhood", neighborhood);
    if (listingType) params.set("listingType", listingType);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return params;
  }

  function resultsPathForTab(nextTab: "sale" | "long_term_rent"): string {
    // Acheter / Louer = pages dédiées (jamais rester sur /acheter avec onglet Louer).
    return nextTab === "sale" ? `/${locale}/acheter` : `/${locale}/louer`;
  }

  function navigateSearch(nextTab: "sale" | "long_term_rent" = tab) {
    if (requireLocation && (!region || !city || !neighborhood)) return;

    const params = buildParams(nextTab);
    const saved: SavedSearch = {
      transactionType: nextTab,
      region,
      city,
      neighborhood,
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

    const path = resultsPathForTab(nextTab);
    router.push(`${path}?${params.toString()}`);
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    navigateSearch(tab);
  }

  function selectTab(nextTab: "sale" | "long_term_rent") {
    setTab(nextTab);
    // Toujours basculer vers /acheter ou /louer (évite onglet Louer + résultats vente).
    if (region && city && neighborhood) {
      navigateSearch(nextTab);
      return;
    }
    const params = buildParams(nextTab);
    router.push(`${resultsPathForTab(nextTab)}?${params.toString()}`);
  }

  function handleReset() {
    setRegion("");
    setCity("");
    setNeighborhood("");
    setListingType("");
    setMinPrice("");
    setMaxPrice("");
    setTab(defaultTransaction);
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
      setTab(saved.transactionType ?? defaultTransaction);
      setRegion(saved.region ?? "");
      setCity(saved.city ?? "");
      setNeighborhood(saved.neighborhood ?? "");
      setListingType(saved.listingType ?? "");
      setMinPrice(saved.minPrice ?? "");
      setMaxPrice(saved.maxPrice ?? "");
    } catch {
      /* ignore */
    }
  }

  const canSearch = !requireLocation || (Boolean(region) && Boolean(city) && Boolean(neighborhood));
  const isHero = variant === "hero";
  const geographyMissing = regions.length === 0;

  return (
    <div
      className={`text-charcoal ${
        isHero
          ? "rounded-2xl border border-charcoal/10 bg-ivory p-6 shadow-xl md:p-8"
          : "rounded-xl border border-charcoal/10 bg-ivory p-4"
      }`}
    >
      {geographyMissing && (
        <p className="mb-4 rounded-lg border border-bronze/30 bg-bronze/10 px-3 py-2 text-sm text-charcoal">
          Données géographiques indisponibles — utilisez les raccourcis sous le formulaire, ou lancez{" "}
          <code className="rounded bg-charcoal/5 px-1">pnpm geography:build</code>.
        </p>
      )}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-charcoal/10 pb-4">
        <button
          type="button"
          onClick={() => selectTab("sale")}
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
          onClick={() => selectTab("long_term_rent")}
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

      <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-charcoal/60">
            1. Région
          </label>
          <Select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setCity("");
              setNeighborhood("");
            }}
            className={selectClassName}
            required={requireLocation}
          >
            <option value="">Choisir une région</option>
            {regions.map((r) => (
              <option key={r.slug} value={r.name}>
                {r.name} ({r.count.toLocaleString("fr-MA")})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-charcoal/60">
            2. Ville
          </label>
          <Select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setNeighborhood("");
            }}
            disabled={!region}
            className={selectClassName}
            required={requireLocation}
          >
            <option value="">{region ? "Choisir une ville" : "Sélectionnez d'abord une région"}</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name} ({c.count.toLocaleString("fr-MA")})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-charcoal/60">
            3. Quartier
          </label>
          <Select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            disabled={!city}
            className={selectClassName}
            required={requireLocation}
          >
            <option value="">
              {city ? "Choisir un quartier" : "Sélectionnez d'abord une ville"}
            </option>
            {neighborhoods.map((n) => (
              <option key={n.slug} value={n.name}>
                {n.name} ({n.count.toLocaleString("fr-MA")})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-charcoal/60">
            Type de bien
          </label>
          <Select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            className={selectClassName}
          >
            <option value="">Tous les types</option>
            <option value="apartment">Appartement</option>
            <option value="villa">Villa</option>
            <option value="riad">Riad</option>
            <option value="land">Terrain</option>
            <option value="commercial">Commercial</option>
          </Select>
        </div>

        <div className="md:col-span-2">
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

        <div className="md:col-span-2 lg:col-span-3">
          <Button
            type="submit"
            disabled={!canSearch}
            className="h-12 w-full gap-2 text-base"
            variant="default"
          >
            <Search className="h-5 w-5" />
            {canSearch
              ? "Rechercher les annonces"
              : !region
                ? "Choisissez une région"
                : !city
                  ? "Choisissez une ville"
                  : "Choisissez un quartier"}
          </Button>
          {requireLocation && (
            <p className="mt-2 text-center text-xs text-charcoal/50">
              Région → ville → quartier obligatoires pour lancer la recherche
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
