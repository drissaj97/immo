import { parsePrice } from "./parse-json-ld";

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export function extractMetaContent(html: string, nameOrProperty: string): string | undefined {
  const escaped = nameOrProperty.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${escaped}["']`,
    "i",
  );
  const match = html.match(re) ?? html.match(alt);
  return match?.[1] ? decodeHtmlEntities(match[1]) : undefined;
}

export function extractTitle(html: string): string | undefined {
  const og = extractMetaContent(html, "og:title");
  if (og) return og.trim();
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return title ? decodeHtmlEntities(title).trim() : undefined;
}

export function extractDescription(html: string): string | undefined {
  return (
    extractMetaContent(html, "description") ??
    extractMetaContent(html, "og:description")
  );
}

export function parseMadPrice(text: string | number | undefined): number {
  if (typeof text === "string" && !/[\d]/.test(text)) return 0;
  // Évite de prendre "45" dans "45 m²" comme prix.
  if (typeof text === "string" && /^\s*\d+\s*m/i.test(text) && !/(?:DH|MAD|Dhs)/i.test(text)) {
    return 0;
  }
  return parsePrice(text);
}

export function extractSurfaceM2(text: string): number | undefined {
  // Pas de \b après ² (non-word) — sinon "68 m² à" ne matche pas.
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)(?=\s|[^\d]|$)/i);
  if (!match) return undefined;
  const n = Number(match[1].replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function extractBedrooms(text: string): number | undefined {
  const match = text.match(/(\d+)\s*chambres?/i);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : undefined;
}

export function extractBathrooms(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(?:salles?\s*de\s*bain|sdb|bathroom)/i);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : undefined;
}

export function capitalizeWords(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Décode les props Astro (`[0, value]` / `[1, array]`). */
export function decodeAstroProps(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  if (raw[0] === 0) return raw[1];
  if (raw[0] === 1) {
    return Array.isArray(raw[1]) ? raw[1].map(decodeAstroProps) : raw[1];
  }
  return raw;
}

export function parseAstroIslandProps(html: string, mustInclude: string): Record<string, unknown> | null {
  const needle = html.indexOf(mustInclude);
  if (needle < 0) return null;
  const start = html.lastIndexOf("<astro-island", needle);
  if (start < 0) return null;
  const end = html.indexOf("</astro-island>", needle);
  if (end < 0) return null;
  const chunk = html.slice(start, end);
  const propsMatch = chunk.match(/props="([\s\S]*?)"\s+(?:ssr|client|opts|component|uid)/);
  if (!propsMatch?.[1]) return null;
  try {
    const json = decodeHtmlEntities(propsMatch[1]);
    const props = JSON.parse(json) as Record<string, unknown>;
    const decoded: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      decoded[key] = decodeAstroProps(value);
    }
    return decoded;
  } catch {
    return null;
  }
}
