import { describe, expect, it } from "vitest";
import {
  isStockListingImage,
  normalizeAvitoImageUrl,
  sanitizeListingImages,
} from "@/lib/media/listing-images";

describe("listing-images", () => {
  it("détecte la photo stock Unsplash villa/piscine", () => {
    expect(
      isStockListingImage(
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      ),
    ).toBe(true);
    expect(isStockListingImage("")).toBe(true);
    expect(
      isStockListingImage("https://content.avito.ma/classifieds/images/10097537906?t=images"),
    ).toBe(false);
  });

  it("retire les placeholders du tableau d'images", () => {
    expect(
      sanitizeListingImages([
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
        "https://content.avito.ma/classifieds/images/10097537906?t=images",
      ]),
    ).toEqual(["https://content.avito.ma/classifieds/images/10097537906?t=images"]);
    expect(sanitizeListingImages([])).toEqual([]);
  });

  it("normalise les URLs Avito", () => {
    expect(
      normalizeAvitoImageUrl("https://content.avito.ma/classifieds/images/10097537906?foo=1"),
    ).toBe("https://content.avito.ma/classifieds/images/10097537906?t=images");
  });
});
