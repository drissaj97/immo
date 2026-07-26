import { normalizeAvitoImageUrl, sanitizeListingImages } from "@/lib/media/listing-images";

function isRealAvitoPhoto(url: string): boolean {
  return /https?:\/\/content\.avito\.ma\/classifieds\/images\/\d+/i.test(url);
}

type AvitoImagePath = {
  paths?: { standard?: string; fullHd?: string; smallThumbnail?: string };
};

/** Images de la fiche détail depuis __NEXT_DATA__ (pas les autres annonces du vendeur). */
function extractImagesFromNextData(html: string): string[] {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match?.[1]) return [];

  try {
    const data = JSON.parse(match[1]) as {
      props?: {
        pageProps?: {
          componentProps?: {
            adInfo?: { ad?: { images?: AvitoImagePath[] } };
          };
          initialReduxState?: {
            ad?: { view?: { adInfo?: { images?: AvitoImagePath[] } } };
          };
          apolloState?: Record<string, unknown>;
        };
      };
    };

    const pageProps = data.props?.pageProps;
    const candidates: AvitoImagePath[][] = [];

    const primary = pageProps?.componentProps?.adInfo?.ad?.images;
    if (Array.isArray(primary) && primary.length) candidates.push(primary);

    const redux = pageProps?.initialReduxState?.ad?.view?.adInfo?.images;
    if (Array.isArray(redux) && redux.length) candidates.push(redux);

    const apollo = pageProps?.apolloState;
    if (apollo && typeof apollo === "object") {
      for (const value of Object.values(apollo)) {
        if (!value || typeof value !== "object") continue;
        const ad = value as {
          media?: {
            defaultImage?: AvitoImagePath;
            media?: { images?: AvitoImagePath[] };
          };
        };
        const mediaImages = ad.media?.media?.images;
        if (Array.isArray(mediaImages) && mediaImages.length) {
          candidates.push(mediaImages);
        }
        if (ad.media?.defaultImage?.paths?.standard) {
          candidates.push([ad.media.defaultImage]);
        }
      }
    }

    const urls: string[] = [];
    for (const group of candidates) {
      for (const img of group) {
        const url = img.paths?.standard || img.paths?.fullHd;
        if (url && isRealAvitoPhoto(url)) urls.push(url);
      }
      if (urls.length) break;
    }
    return urls;
  } catch {
    return [];
  }
}

function extractOgImage(html: string): string | null {
  const ogMatch =
    html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
    html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i);
  const url = ogMatch?.[1];
  return url && isRealAvitoPhoto(url) ? url : null;
}

/**
 * Photos Avito depuis HTML de fiche.
 * Priorité : galerie __NEXT_DATA__ de l'annonce, puis og:image.
 * Ne prend jamais les vignettes "autres annonces du vendeur" / suggestions.
 */
export function extractAvitoImagesFromHtml(html: string): string[] {
  const fromNext = extractImagesFromNextData(html);
  const og = extractOgImage(html);
  const found = [...fromNext];
  if (og) found.unshift(og);
  return sanitizeListingImages(found.map(normalizeAvitoImageUrl)).slice(0, 8);
}
