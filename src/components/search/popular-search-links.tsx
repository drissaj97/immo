import Link from "next/link";
import { POPULAR_SEARCHES, popularSearchHref } from "@/lib/search/popular-searches";

type PopularSearchLinksProps = {
  locale: string;
  path?: "biens" | "carte" | "acheter" | "louer";
  className?: string;
};

export function PopularSearchLinks({
  locale,
  path = "biens",
  className = "",
}: PopularSearchLinksProps) {
  return (
    <div className={`flex flex-wrap justify-center gap-2 ${className}`}>
      {POPULAR_SEARCHES.map((search) => (
        <Link
          key={search.label}
          href={popularSearchHref(locale, search, path)}
          className="rounded-lg border border-deep-green/25 bg-deep-green/5 px-3 py-2 text-sm text-deep-green transition hover:border-deep-green/50 hover:bg-deep-green/10"
        >
          {search.label}
        </Link>
      ))}
    </div>
  );
}
