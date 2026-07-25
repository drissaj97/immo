import type { CityIndex, RegionIndex } from "./types";

export type NeighborhoodSearchNode = {
  name: string;
  slug: string;
  count: number;
};

export type CitySearchNode = {
  name: string;
  slug: string;
  count: number;
  region: string;
  regionSlug: string;
  neighborhoods: NeighborhoodSearchNode[];
};

export type RegionSearchNode = {
  name: string;
  slug: string;
  count: number;
  cities: CitySearchNode[];
};

export type GeographySearchTree = {
  regions: RegionSearchNode[];
};

export function buildGeographySearchTree(
  regions: RegionIndex[],
  cities: CityIndex[],
): GeographySearchTree {
  const cityByName = new Map(cities.map((c) => [c.name, c]));

  return {
    regions: regions.map((region) => ({
      name: region.name,
      slug: region.slug,
      count: region.count,
      cities: region.cities
        .map((cityName) => {
          const city = cityByName.get(cityName);
          if (!city) return null;
          return {
            name: city.name,
            slug: city.slug,
            count: city.count,
            region: city.region,
            regionSlug: city.regionSlug,
            neighborhoods: city.neighborhoods.map((n) => ({
              name: n.name,
              slug: n.slug,
              count: n.count,
            })),
          };
        })
        .filter((c): c is CitySearchNode => c !== null)
        .sort((a, b) => b.count - a.count),
    })),
  };
}
