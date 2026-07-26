/**
 * Photos génériques / stock à ne jamais afficher comme photo d'annonce :
 * - Unsplash villa/piscine (ancien fallback DarBladi)
 * - Placeholder Semsar AI
 */
const STOCK_PLACEHOLDER_RE =
  /images\.unsplash\.com\/photo-1600596542815|images\.unsplash\.com\/photo-1600607687939|semsarai\.ma\/default-property-image/i;

export function isStockListingImage(url: string | null | undefined): boolean {
  if (!url) return true;
  return STOCK_PLACEHOLDER_RE.test(url);
}

/** Ne conserve que de vraies URLs photo (pas de stock Unsplash, pas de data: vides). */
export function sanitizeListingImages(images?: string[] | null): string[] {
  if (!images?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of images) {
    const url = (raw ?? "").trim();
    if (!url || isStockListingImage(url) || url.startsWith("data:")) continue;
    const key = url.split("?")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

/** Normalise une URL image Avito (content.avito.ma). */
export function normalizeAvitoImageUrl(url: string): string {
  const trimmed = url.trim();
  const match = trimmed.match(
    /(https?:\/\/content\.avito\.ma\/classifieds\/images\/\d+)/i,
  );
  if (match) return `${match[1]}?t=images`;
  return trimmed.split("?")[0];
}
