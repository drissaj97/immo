"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DEMO_LISTINGS } from "@/lib/data/demo-data";
import { ListingCard } from "@/components/listings/listing-card";

function readFavoriteListings() {
  if (typeof window === "undefined") return [];
  const ids = JSON.parse(localStorage.getItem("darbladi_favorites") ?? "[]") as string[];
  return DEMO_LISTINGS.filter((l) => ids.includes(l.id));
}

export default function FavorisPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "fr";
  const [favorites] = useState(readFavoriteListings);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Favoris</h1>
      {favorites.length === 0 ? (
        <p className="mt-4 text-charcoal/60">
          Aucun favori.{" "}
          <Link href={`/${locale}/biens`} className="text-deep-green">
            Parcourir les biens
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((l) => (
            <ListingCard key={l.id} listing={l} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
