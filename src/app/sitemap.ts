import type { MetadataRoute } from "next";
import { DEMO_LISTINGS } from "@/lib/data/demo-data";
import { NEIGHBORHOOD_KNOWLEDGE } from "@/lib/data/neighborhood-knowledge";
import { DEMO_ORGANIZATIONS } from "@/lib/data/marketplace-data";

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
    "/professionnels",
    "/promoteurs",
    "/contact",
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

    for (const n of NEIGHBORHOOD_KNOWLEDGE) {
      const [ville, quartier] = n.slug.split("/");
      entries.push({
        url: `${baseUrl}/${locale}/villes/${ville}/${quartier}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }

    for (const org of DEMO_ORGANIZATIONS) {
      const base = org.type === "developer" ? "promoteurs" : "professionnels";
      entries.push({
        url: `${baseUrl}/${locale}/${base}/${org.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
