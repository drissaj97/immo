"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "darbladi_favorites";

/** Affiche les favoris localStorage pour les visiteurs non connectés. */
export function LocalFavoritesPanel({ locale }: { locale: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
      setCount(ids.length);
    } catch {
      setCount(0);
    }
  }, []);

  if (count === 0) {
    return (
      <p className="mt-4 text-charcoal/60">
        Aucun favori sur cet appareil.{" "}
        <Link href={`/${locale}/biens`} className="text-deep-green">
          Parcourir les biens
        </Link>
      </p>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-charcoal/10 p-4">
      <p className="text-sm text-charcoal/70">
        {count} favori{count > 1 ? "s" : ""} enregistré{count > 1 ? "s" : ""} sur cet appareil.
      </p>
      <p className="mt-2 text-sm text-charcoal/55">
        <Link
          href={`/${locale}/connexion?next=/${locale}/dashboard/favoris`}
          className="text-deep-green underline"
        >
          Connectez-vous
        </Link>{" "}
        pour synchroniser vos favoris et les retrouver partout.
      </p>
    </div>
  );
}
