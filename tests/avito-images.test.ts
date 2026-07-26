import { describe, expect, it } from "vitest";
import { extractAvitoImagesFromHtml } from "@/lib/scraping/sources/avito-images";

describe("extractAvitoImagesFromHtml", () => {
  it("lit og:image et ignore unsplash / logos", () => {
    const html = `
      <meta property="og:image" content="https://content.avito.ma/classifieds/images/10142140903?t=images" />
      <meta property="og:image" content="/phoenix-assets/imgs/layout/logo.webp" />
      <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800" />
      <img src="https://content.avito.ma/classifieds/images/10136305627" />
    `;
    const images = extractAvitoImagesFromHtml(html);
    expect(images[0]).toContain("10142140903");
    expect(images.some((u) => u.includes("10136305627"))).toBe(true);
    expect(images.join(",")).not.toMatch(/unsplash|logo\.webp/i);
  });
});
