const HOLDING_IMAGE_RE =
  /(?:https:\/\/holdingimmo\.com)?(\/storage\/(?:uploads|properties)\/[^\s"'<>]+\.(?:jpe?g|png|webp))/gi;

/** Images récurrentes invalides (placeholder site Holding IMMO, 404). */
const EXCLUDED_IMAGE_FRAGMENTS = ["IqBXeWe1ziEPt0uQmozerywsTt05Sp0ysVwjkvpF.webp"];

function isExcludedImage(url: string): boolean {
  return EXCLUDED_IMAGE_FRAGMENTS.some((frag) => url.includes(frag));
}

/** Extrait les URLs d'images Holding IMMO depuis le HTML d'une fiche. */
export function extractHoldingImagesFromHtml(html: string, baseUrl = "https://holdingimmo.com"): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const match of html.matchAll(HOLDING_IMAGE_RE)) {
    const path = match[1].startsWith("/") ? match[1] : `/${match[1]}`;
    const absolute = path.startsWith("http") ? path : `${baseUrl.replace(/\/$/, "")}${path}`;
    const normalized = absolute.split("?")[0];
    if (seen.has(normalized) || isExcludedImage(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
  }

  return urls;
}

/** Fusionne JSON-LD et HTML en conservant l'ordre et sans doublons. */
export function mergeListingImages(
  jsonLdImages: string[],
  htmlImages: string[],
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const url of [...jsonLdImages, ...htmlImages]) {
    const normalized = url.split("?")[0];
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    merged.push(normalized);
  }

  return merged;
}
