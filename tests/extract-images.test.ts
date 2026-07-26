import { describe, expect, it } from "vitest";
import { extractHoldingImagesFromHtml, mergeListingImages } from "@/lib/media/extract-images";

describe("extractHoldingImagesFromHtml", () => {
  it("extrait uploads absolus et relatifs", () => {
    const html = `
      <img src="https://holdingimmo.com/storage/uploads/abc.jpg" />
      <img src="/storage/uploads/def.jpeg" />
      <img src="/storage/properties/HI119/photo-01.jpeg" />
    `;
    const urls = extractHoldingImagesFromHtml(html);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toBe("https://holdingimmo.com/storage/uploads/abc.jpg");
    expect(urls[1]).toBe("https://holdingimmo.com/storage/uploads/def.jpeg");
    expect(urls[2]).toBe("https://holdingimmo.com/storage/properties/HI119/photo-01.jpeg");
  });

  it("déduplique les URLs", () => {
    const html = `
      <img src="/storage/uploads/same.jpg" />
      <img src="https://holdingimmo.com/storage/uploads/same.jpg" />
    `;
    expect(extractHoldingImagesFromHtml(html)).toHaveLength(1);
  });
});

describe("mergeListingImages", () => {
  it("fusionne JSON-LD et HTML sans doublons", () => {
    const merged = mergeListingImages(
      ["https://holdingimmo.com/storage/uploads/a.jpg"],
      ["https://holdingimmo.com/storage/uploads/a.jpg", "https://holdingimmo.com/storage/uploads/b.jpg"],
    );
    expect(merged).toEqual([
      "https://holdingimmo.com/storage/uploads/a.jpg",
      "https://holdingimmo.com/storage/uploads/b.jpg",
    ]);
  });
});
