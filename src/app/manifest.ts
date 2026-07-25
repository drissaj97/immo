import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DarBladi — Immobilier Maroc",
    short_name: "DarBladi",
    description: "Marketplace immobilière intelligente au Maroc",
    start_url: "/fr",
    display: "standalone",
    background_color: "#FAF8F5",
    theme_color: "#1B4332",
    orientation: "portrait-primary",
    lang: "fr",
    categories: ["business", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
