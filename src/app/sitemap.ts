import type { MetadataRoute } from "next";
import { DEMO_LISTINGS } from "@/lib/data/demo-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const locales = ["fr", "en", "ar"];

  const staticPaths = [
    "",
    "/acheter",
    "/louer",
    "/neuf",
    "/biens",
    "/carte",
    "/investir",
    "/simulateur-rentabilite",
    "/darbladi",
    "/comparer",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
      });
    }
    for (const listing of DEMO_LISTINGS.filter((l) => l.status === "published")) {
      entries.push({
        url: `${baseUrl}/${locale}/biens/${listing.slug}`,
        lastModified: new Date(listing.publishedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
