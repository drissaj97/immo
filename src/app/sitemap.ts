import type { MetadataRoute } from "next";
import { getAggregatedListings } from "@/lib/aggregation/sync";
import { buildCatalogNeighborhoods } from "@/lib/aggregation/catalog-analytics";
import { PARTNER_ORGANIZATIONS } from "@/lib/data/marketplace-data";
import { getGeographyIndex } from "@/lib/geography/index";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const locales = ["fr", "en", "ar"];

  const staticPaths = [
    "",
    "/acheter",
    "/louer",
    "/neuf",
    "/biens",
    "/villes",
    "/regions",
    "/carte",
    "/investir",
    "/simulateur-rentabilite",
    "/darbladi",
    "/comparer",
    "/professionnels",
    "/promoteurs",
    "/contact",
    "/developpeurs",
    "/conformite",
  ];

  const catalog = await getAggregatedListings();
  const publishedListings = catalog.filter((l) => l.status === "published" && !l.isDemo);

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

    for (const listing of publishedListings) {
      entries.push({
        url: `${baseUrl}/${locale}/biens/${listing.slug}`,
        lastModified: new Date(listing.publishedAt),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const n of buildCatalogNeighborhoods()) {
      const [ville, quartier] = n.slug.split("/");
      entries.push({
        url: `${baseUrl}/${locale}/villes/${ville}/${quartier}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }

    const geo = getGeographyIndex();
    if (geo) {
      for (const city of geo.cities) {
        entries.push({
          url: `${baseUrl}/${locale}/villes/${city.slug}`,
          lastModified: new Date(geo.builtAt),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      for (const region of geo.regions) {
        entries.push({
          url: `${baseUrl}/${locale}/regions/${region.slug}`,
          lastModified: new Date(geo.builtAt),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    for (const org of PARTNER_ORGANIZATIONS) {
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
