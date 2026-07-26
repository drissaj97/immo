import { normalizeAvitoImageUrl, sanitizeListingImages } from "@/lib/media/listing-images";

function isRealAvitoPhoto(url: string): boolean {
  return /https?:\/\/content\.avito\.ma\/classifieds\/images\/\d+/i.test(url);
}

/** Photos Avito depuis HTML de fiche (og:image + URLs content.avito.ma). */
export function extractAvitoImagesFromHtml(html: string): string[] {
  const found: string[] = [];
  const og =
    html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
    html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
  if (og?.[1] && isRealAvitoPhoto(og[1])) found.push(og[1]);

  for (const match of html.matchAll(
    /https?:\/\/content\.avito\.ma\/classifieds\/images\/\d+/gi,
  )) {
    found.push(match[0]);
  }

  return sanitizeListingImages(found.map(normalizeAvitoImageUrl)).slice(0, 8);
}
