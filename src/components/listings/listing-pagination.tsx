import Link from "next/link";

export function ListingPagination({
  locale,
  page,
  totalPages,
  searchParams,
}: {
  locale: string;
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  function pageHref(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value === undefined) continue;
      if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
      else params.set(key, value);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/${locale}/biens${qs ? `?${qs}` : ""}`;
  }

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={pageHref(page - 1)}
          className="rounded-lg border border-charcoal/15 px-4 py-2 text-sm hover:border-deep-green/40"
        >
          ← Précédent
        </Link>
      )}
      {start > 1 && (
        <>
          <Link href={pageHref(1)} className="rounded-lg px-3 py-2 text-sm hover:bg-sand/50">
            1
          </Link>
          {start > 2 && <span className="text-charcoal/40">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(p)}
          className={`rounded-lg px-3 py-2 text-sm ${
            p === page ? "bg-deep-green text-ivory" : "hover:bg-sand/50"
          }`}
        >
          {p}
        </Link>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-charcoal/40">…</span>}
          <Link href={pageHref(totalPages)} className="rounded-lg px-3 py-2 text-sm hover:bg-sand/50">
            {totalPages.toLocaleString("fr-MA")}
          </Link>
        </>
      )}
      {page < totalPages && (
        <Link
          href={pageHref(page + 1)}
          className="rounded-lg border border-charcoal/15 px-4 py-2 text-sm hover:border-deep-green/40"
        >
          Suivant →
        </Link>
      )}
    </nav>
  );
}
