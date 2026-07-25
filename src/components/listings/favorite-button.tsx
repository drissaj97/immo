"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("samsar_favorites") ?? "[]") as string[];
}

export function FavoriteButton({ listingId }: { listingId: string; locale: string }) {
  const [active, setActive] = useState(() => readFavorites().includes(listingId));

  function toggle() {
    const favs = readFavorites();
    const next = active ? favs.filter((id) => id !== listingId) : [...favs, listingId];
    localStorage.setItem("samsar_favorites", JSON.stringify(next));
    setActive(!active);
  }

  return (
    <Button variant={active ? "default" : "outline"} onClick={toggle}>
      <Heart className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
      {active ? "Favori" : "Ajouter aux favoris"}
    </Button>
  );
}
