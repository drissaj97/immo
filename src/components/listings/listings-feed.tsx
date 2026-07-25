"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ListingCard } from "@/components/listings/listing-card";
import type { ListingWithLocation } from "@/server/repositories/listings";
import { LISTINGS_PAGE_SIZE } from "@/lib/search/page-size";

type SearchQuery = {
  region?: string;
  city?: string;
  neighborhood?: string;
  transactionType?: string;
  listingType?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  sort?: string;
};

export function ListingsFeed({
  locale,
  initialItems,
  total,
  totalPages,
  query,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
}: {
  locale: string;
  initialItems: ListingWithLocation[];
  total: number;
  totalPages: number;
  query: SearchQuery;
  columns?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(totalPages > 1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initialItems);
    setPage(1);
    setHasMore(totalPages > 1);
    setError(null);
  }, [initialItems, totalPages]);

  async function loadNextPage() {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value) params.set(key, value);
      }
      params.set("page", String(nextPage));
      params.set("limit", String(LISTINGS_PAGE_SIZE));

      const res = await fetch(`/${locale}/api/search/listings?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        items: ListingWithLocation[];
        totalPages: number;
        page: number;
      };

      startTransition(() => {
        setItems((prev) => {
          const seen = new Set(prev.map((l) => l.id));
          const merged = [...prev];
          for (const item of data.items) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            merged.push(item);
          }
          return merged;
        });
        setPage(data.page);
        setHasMore(data.page < data.totalPages);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      loadingRef.current = false;
    }
  }

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, page, query, locale]);

  return (
    <div>
      <div className={`grid gap-6 ${columns}`}>
        {items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} locale={locale} />
        ))}
      </div>

      <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-3 py-4">
        {hasMore && (
          <button
            type="button"
            onClick={() => void loadNextPage()}
            disabled={isPending || loadingRef.current}
            className="rounded-lg border border-charcoal/15 bg-ivory px-5 py-2.5 text-sm text-charcoal hover:border-deep-green/40 disabled:opacity-50"
          >
            {isPending || loadingRef.current
              ? "Chargement…"
              : `Charger ${LISTINGS_PAGE_SIZE} annonces de plus`}
          </button>
        )}
        <p className="text-xs text-charcoal/50">
          {items.length.toLocaleString("fr-MA")} / {total.toLocaleString("fr-MA")} annonces affichées
          {hasMore ? " · chargement automatique en cours" : ""}
        </p>
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    </div>
  );
}
