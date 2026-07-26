"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

function readLocalFavorites(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("darbladi_favorites") ?? "[]") as string[];
}

export function FavoriteButton({ listingId, locale }: { listingId: string; locale: string }) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/${locale}/api/favorites`);
        if (res.ok) {
          const data = (await res.json()) as { favorites: string[] };
          setActive(data.favorites.includes(listingId));
          return;
        }
      } catch {
        // fallback local
      }
      setActive(readLocalFavorites().includes(listingId));
    }
    void load();
  }, [listingId, locale]);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/${locale}/api/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { active: boolean };
        setActive(data.active);
        setLoading(false);
        return;
      }
    } catch {
      // fallback local
    }

    const favs = readLocalFavorites();
    const next = active ? favs.filter((id) => id !== listingId) : [...favs, listingId];
    localStorage.setItem("darbladi_favorites", JSON.stringify(next));
    setActive(!active);
    setLoading(false);
  }

  return (
    <Button variant={active ? "default" : "outline"} onClick={toggle} disabled={loading}>
      <Heart className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
      {active ? "Favori" : "Ajouter aux favoris"}
    </Button>
  );
}
