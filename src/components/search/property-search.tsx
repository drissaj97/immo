"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  maxPrice: string;
  minPrice: string;
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

/** Exporte pour tests — déduit Acheter/Louer depuis l’URL. */
export function tabFromPathname(pathname: string | null): "sale" | "long_term_rent" | null {
  if (!pathname) return null;
  if (/\/louer\/?$/.test(pathname)) return "long_term_rent";
  if (/\/acheter\/?$/.test(pathname)) return "sale";
  return null;
}

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
  const pathname = usePathname();
  const pathTab = tabFromPathname(pathname);
  const [tab, setTab] = useState<"sale" | "long_term_rent">(
    pathTab ?? initial?.transactionType ?? defaultTransaction,
  );
  /** Onglet affiché = page courante si /acheter|/louer (évite Louer coché sur catalogue vente). */
  const activeTab = pathTab ?? tab;
  const [region, setRegion] = useState(initial?.region ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood ?? "");
  const [listingType, setListingType] = useState(initial?.listingType ?? "");
  const [minPrice, setMinPrice] = useState(initial?.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(initial?.maxPrice ?? "");
  const [hasSaved, setHasSaved] = useState(false);

  // Resync si l’URL / les props serveur changent (App Router garde sinon le state client).
  useEffect(() => {
    if (pathTab) setTab(pathTab);
    else if (initial?.transactionType) setTab(initial.transactionType);
    if (initial?.region != null) setRegion(initial.region);
    if (initial?.city != null) setCity(initial.city);
    if (initial?.neighborhood != null) setNeighborhood(initial.neighborhood);
    if (initial?.listingType != null) setListingType(initial.listingType);
    if (initial?.minPrice != null) setMinPrice(initial.minPrice);
    if (initial?.maxPrice != null) setMaxPrice(initial.maxPrice);
  }, [
    pathTab,
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

  function buildParams(nextTab: "sale" | "long_term_rent" = activeTab): URLSearchParams {
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

  function persistSearch(nextTab: "sale" | "long_term_rent") {
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
  }

  /** Navigation pleine page : garantit un catalogue 100 % vente ou 100 % location. */
  function goToTransaction(nextTab: "sale" | "long_term_rent", opts?: { requireComplete?: boolean }) {
    if (opts?.requireComplete && requireLocation && (!region || !city || !neighborhood)) {
      return false;
    }
    persistSearch(nextTab);
    const href = `${resultsPathForTab(nextTab)}?${buildParams(nextTab).toString()}`;
    // Hard nav : évite le soft-nav Next qui peut laisser les résultats vente à l’écran.
    if (typeof window !== "undefined") {
      window.location.assign(href);
      return true;
    }
    router.push(href);
    return true;
  }

  function navigateSearch(nextTab: "sale" | "long_term_rent" = activeTab) {
    goToTransaction(nextTab, { requireComplete: true });
  }

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    navigateSearch(activeTab);
  }

  function selectTab(nextTab: "sale" | "long_term_rent") {
    if (nextTab === activeTab && pathTab === nextTab) return;
    setTab(nextTab);
    // Toujours changer de page métier → le serveur filtre sale vs long_term_rent.
    goToTransaction(nextTab);
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
      const nextTab = saved.transactionType ?? defaultTransaction;
      setTab(nextTab);
      setRegion(saved.region ?? "");
      setCity(saved.city ?? "");
      setNeighborhood(saved.neighborhood ?? "");
      setListingType(saved.listingType ?? "");
      setMinPrice(saved.minPrice ?? "");
      setMaxPrice(saved.maxPrice ?? "");
      // Reprend sur la bonne page (vente vs location).
      const params = new URLSearchParams();
      params.set("transactionType", nextTab);
      if (saved.region) params.set("region", saved.region);
      if (saved.city) params.set("city", saved.city);
      if (saved.neighborhood) params.set("neighborhood", saved.neighborhood);
      if (saved.listingType) params.set("listingType", saved.listingType);
      if (saved.minPrice) params.set("minPrice", saved.minPrice);
      if (saved.maxPrice) params.set("maxPrice", saved.maxPrice);
      const path = nextTab === "sale" ? `/${locale}/acheter` : `/${locale}/louer`;
      if (typeof window !== "undefined") {
        window.location.assign(`${path}?${params.toString()}`);
      }
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
            activeTab === "sale"
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
            activeTab === "long_term_rent"
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
