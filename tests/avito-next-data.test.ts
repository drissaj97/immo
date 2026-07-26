import { describe, expect, it } from "vitest";
import {
  extractAdsFromNextData,
  mapNextAdToListing,
} from "@/lib/scraping/sources/avito-scraper";

describe("avito NEXT_DATA", () => {
  it("extrait les annonces avec photos", () => {
    const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          componentProps: {
            ads: {
              ads: [
                {
                  listId: "57218608",
                  subject: "Terrain 188m² Maarif",
                  description: "Terrain",
                  href: "https://www.avito.ma/fr/maarif/terrains_et_fermes/Terrain_188m²_Maarif_57218608.htm",
                  defaultImage: "https://content.avito.ma/classifieds/images/10140000001?t=images",
                  images: ["https://content.avito.ma/classifieds/images/10140000001?t=images"],
                  location: "Casablanca, Maarif",
                  price: { value: 7500000, currency: "DH" },
                  adType: { key: "SELL", label: "à vendre" },
                  category: { name: "Terrains et Fermes" },
                },
              ],
            },
          },
        },
      },
    })}</script></html>`;

    const ads = extractAdsFromNextData(html);
    expect(ads).toHaveLength(1);
    const listing = mapNextAdToListing(ads[0]!, "casablanca");
    expect(listing?.externalId).toBe("57218608");
    expect(listing?.images[0]).toContain("content.avito.ma");
    expect(listing?.images.join(",")).not.toMatch(/unsplash/i);
  });
});
