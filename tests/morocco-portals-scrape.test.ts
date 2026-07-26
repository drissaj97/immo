import { describe, expect, it } from "vitest";
import { isScrapePortal, MOROCCO_PORTALS, SCRAPE_PORTAL_IDS } from "@/lib/scraping/portals";
import {
  extractAgenzId,
  extractAgenzListingUrls,
  parseAgenzDetail,
} from "@/lib/scraping/sources/agenz-scraper";
import {
  extractYakeeyId,
  extractYakeeyListingUrls,
  parseYakeeyDetail,
} from "@/lib/scraping/sources/yakeey-scraper";

describe("Morocco portals registry", () => {
  it("expose les 5 portails scrapables", () => {
    expect(SCRAPE_PORTAL_IDS).toEqual(
      expect.arrayContaining(["sarouty", "mubawab", "avito", "agenz", "yakeey"]),
    );
    expect(isScrapePortal("agenz")).toBe(true);
    expect(isScrapePortal("wandaloo")).toBe(false);
    expect(MOROCCO_PORTALS.filter((p) => p.scrapePortal).length).toBeGreaterThanOrEqual(5);
  });
});

describe("Agenz parser", () => {
  it("extrait les URLs d'annonces sans tronquer l'id (/video)", () => {
    const html = `
      <a href="/fr/annonces/immo-casablanca/vente-appartements/la-vilette/450345">x</a>
      <a href="/fr/annonces/immo-casablanca/vente-appartements/la-vilette/450345/video">v</a>
      <a href="/fr/annonces/immo-rabat/location-appartements/agdal/123">y</a>
    `;
    const urls = extractAgenzListingUrls(html);
    expect(urls).toContain(
      "https://agenz.ma/fr/annonces/immo-casablanca/vente-appartements/la-vilette/450345",
    );
    expect(urls).toContain(
      "https://agenz.ma/fr/annonces/immo-rabat/location-appartements/agdal/123",
    );
    expect(urls.some((u) => u.includes("45034") && !u.includes("450345"))).toBe(false);
    expect(urls.every((u) => !u.endsWith("/video"))).toBe(true);
    expect(extractAgenzId(urls[0]!)).toBe("450345");
  });

  it("parse une fiche Astro (props prixString)", () => {
    const html = `
      <html>
        <meta property="og:title" content="Appartement à vendre 88 m², 2 chambres - La Vilette" />
        <meta name="description" content="Bel appartement 88 m² avec 2 salles de bain" />
        <div price="1100000"></div>
        <astro-island props="{&quot;prixString&quot;:[0,&quot;1 100 000&quot;],&quot;transaction_type&quot;:[0,&quot;Vente&quot;],&quot;typologie&quot;:[0,2],&quot;sdb&quot;:[0,2],&quot;surface&quot;:[0,88],&quot;type&quot;:[0,&quot;Appartement&quot;],&quot;alt&quot;:[0,&quot;Appartement à vendre 88 m², 2 chambres - La Vilette&quot;],&quot;phone&quot;:[0,&quot;+212665352431&quot;],&quot;images&quot;:[1,[[0,&quot;https://media.agenz.ma/images/x/a.jpg&quot;]]]}" ssr client="load"></astro-island>
      </html>
    `;
    const listing = parseAgenzDetail(
      html,
      "https://agenz.ma/fr/annonces/immo-casablanca/vente-appartements/la-vilette/450345",
    );
    expect(listing?.price).toBe(1100000);
    expect(listing?.livingArea).toBe(88);
    expect(listing?.bedrooms).toBe(2);
    expect(listing?.bathrooms).toBe(2);
    expect(listing?.city).toBe("Casablanca");
    expect(listing?.neighborhood).toBe("La Vilette");
    expect(listing?.phone).toBe("+212665352431");
    expect(listing?.images?.[0]).toContain("media.agenz.ma");
    expect(listing?.transactionType).toBe("sale");
  });

  it("ignore les pages index / biens vendus / prix absurde", () => {
    const indexHtml = `
      <html><title>121 Appartements à vendre à Bouskoura - agenz</title></html>
    `;
    expect(
      parseAgenzDetail(
        indexHtml,
        "https://agenz.ma/fr/annonces/immo-bouskoura/vente-appartements/bouskoura/424357",
      ),
    ).toBeNull();

    const soldHtml = `
      <html>
        <title>Studio vendu 45 m² - Martil</title>
        <astro-island props="{&quot;prixString&quot;:[0,&quot;&quot;],&quot;vendu&quot;:[0,true],&quot;alt&quot;:[0,&quot;Studio vendu 45 m² - Martil&quot;]}" ssr client="load"></astro-island>
      </html>
    `;
    expect(
      parseAgenzDetail(
        soldHtml,
        "https://agenz.ma/fr/annonces/immo-m-diq-fnideq/vente-appartements/autre/72675",
      ),
    ).toBeNull();
  });
});

describe("Yakeey parser", () => {
  it("extrait les URLs d'annonces", () => {
    const html = `
      <a href="/fr-ma/acheter-appartement-casablanca-maarif-ca202105">a</a>
      <a href="/fr-ma/acheter-appartement-casablanca-maarif-ca202105#simulation">b</a>
      <a href="/fr-ma/louer-mon-bien">skip</a>
    `;
    const urls = extractYakeeyListingUrls(html);
    expect(urls).toEqual([
      "https://www.yakeey.com/fr-ma/acheter-appartement-casablanca-maarif-ca202105",
    ]);
    expect(extractYakeeyId(urls[0])).toBe("ca202105");
  });

  it("parse titre/meta/RSC", () => {
    const html = `
      <html>
        <title>Appartement 68 m² à vendre à Casablanca Maarif - 990 000 DH</title>
        <meta name="description" content="À vendre : Charmant appartement de 68 m². 2 chambres et une salle de bain. Prix : 990 000 Dhs." />
        <script>self.__next_f.push([1,"{\\"salePrice\\":990000,\\"citySlug\\":\\"Casablanca\\",\\"neighborhoodSlug\\":\\"Maarif\\"}"])</script>
        <img src="https://medias.yakeey.com/cdn-cgi/image/format=auto/ca202105/image_1.jpg" />
      </html>
    `;
    const listing = parseYakeeyDetail(
      html,
      "https://www.yakeey.com/fr-ma/acheter-appartement-casablanca-maarif-ca202105",
    );
    expect(listing?.externalId).toBe("ca202105");
    expect(listing?.price).toBe(990000);
    expect(listing?.livingArea).toBe(68);
    expect(listing?.bedrooms).toBe(2);
    expect(listing?.city.toLowerCase()).toContain("casablanca");
    expect(listing?.transactionType).toBe("sale");
    expect(listing?.images?.length).toBeGreaterThan(0);
  });
});
