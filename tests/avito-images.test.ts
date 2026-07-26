import { describe, expect, it } from "vitest";
import { extractAvitoImagesFromHtml } from "@/lib/scraping/sources/avito-images";

describe("extractAvitoImagesFromHtml", () => {
  it("prend la galerie __NEXT_DATA__ de l'annonce, pas les autres annonces du vendeur", () => {
    const html = `
      <meta property="og:image" content="https://content.avito.ma/classifieds/images/10150582470?t=images" />
      <meta property="og:image" content="/phoenix-assets/imgs/layout/logo.webp" />
      <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800" />
      <img src="https://content.avito.ma/classifieds/images/10137201988" />
      <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
        props: {
          pageProps: {
            componentProps: {
              adInfo: {
                ad: {
                  images: [
                    {
                      paths: {
                        standard:
                          "https://content.avito.ma/classifieds/images/10150582470?t=images",
                      },
                    },
                  ],
                },
              },
            },
            apolloState: {
              'ROOT_QUERY.getPublishedAd({"query":{"listId":"58097172"}})': {
                media: {
                  media: {
                    images: [
                      {
                        paths: {
                          standard:
                            "https://content.avito.ma/classifieds/images/10150582470?t=images",
                        },
                      },
                    ],
                  },
                },
                seller: {
                  latestActiveAdsImages: [
                    {
                      paths: {
                        standard:
                          "https://content.avito.ma/classifieds/images/10137201988?t=images",
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      })}</script>
    `;
    const images = extractAvitoImagesFromHtml(html);
    expect(images).toHaveLength(1);
    expect(images[0]).toContain("10150582470");
    expect(images.join(",")).not.toMatch(/10137201988|unsplash|logo\.webp|default-property/i);
  });

  it("fallback og:image si pas de __NEXT_DATA__", () => {
    const html = `
      <meta property="og:image" content="https://content.avito.ma/classifieds/images/10150582470?t=images" />
      <img src="https://content.avito.ma/classifieds/images/10137201988" />
    `;
    const images = extractAvitoImagesFromHtml(html);
    expect(images).toEqual([
      "https://content.avito.ma/classifieds/images/10150582470?t=images",
    ]);
  });
});
