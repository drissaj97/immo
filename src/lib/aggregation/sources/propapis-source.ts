import type { AggregatedListing } from "../types";
import { normalizePartnerListing } from "../normalizer";

/** PropAPIS — agrégateur licencié (https://propapis.com). Nécessite PROPAPIS_API_KEY. */
export async function fetchPropAPISListings(): Promise<AggregatedListing[]> {
  const apiKey = process.env.PROPAPIS_API_KEY;
  if (!apiKey) return [];

  const cities = (process.env.PROPAPIS_CITIES ?? "casablanca,rabat,marrakech,tanger,agadir").split(",");
  const results: AggregatedListing[] = [];

  for (const city of cities) {
    for (const platform of ["mubawab", "avito"] as const) {
      try {
        const url = new URL(`https://api.propapis.com/v1/${platform}/search`);
        url.searchParams.set("city", city.trim());
        url.searchParams.set("purpose", "for-sale");
        url.searchParams.set("limit", "50");

        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          console.warn(`[propapis] ${platform}/${city}: HTTP ${res.status}`);
          continue;
        }

        const data = (await res.json()) as {
          listings?: Array<{
            id: string;
            title: string;
            price: number;
            currency?: string;
            city?: string;
            district?: string;
            bedrooms?: number;
            bathrooms?: number;
            surface?: number;
            url: string;
            images?: string[];
            property_type?: string;
          }>;
        };

        for (const item of data.listings ?? []) {
          results.push(
            normalizePartnerListing(
              {
                externalId: item.id,
                title: item.title,
                price: item.price,
                currency: (item.currency as "MAD") ?? "MAD",
                city: item.city ?? city,
                neighborhood: item.district,
                bedrooms: item.bedrooms,
                bathrooms: item.bathrooms,
                livingArea: item.surface,
                listingType: inferType(item.property_type ?? item.title),
                sourceUrl: item.url,
                images: item.images,
              },
              platform,
              "licensed_api",
            ),
          );
        }
      } catch (err) {
        console.warn(`[propapis] ${platform}/${city}:`, err);
      }
    }
  }

  return results;
}

function inferType(hint: string): "apartment" | "villa" | "riad" | "land" | "commercial" {
  const h = hint.toLowerCase();
  if (h.includes("riad")) return "riad";
  if (h.includes("terrain") || h.includes("land")) return "land";
  if (h.includes("appartement") || h.includes("apartment")) return "apartment";
  if (h.includes("local") || h.includes("bureau")) return "commercial";
  if (h.includes("villa")) return "villa";
  return "apartment";
}
