import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from "fs";
import path from "path";
import type { AggregatedListing, AggregationSourceId, PartnerFeedFile, RawPartnerListing } from "../types";
import { sanitizeListingImages } from "@/lib/media/listing-images";
import { normalizePartnerListing } from "../normalizer";

const FEED_DIR = path.join(process.cwd(), "data/feeds");
const MAX_FEED_LISTINGS = Number(process.env.PARTNER_FEED_MAX_LISTINGS ?? "3000");

const feedCache = new Map<AggregationSourceId, AggregatedListing[]>();
const cityFeedCache = new Map<string, AggregatedListing[]>();

function slimRaw(raw: RawPartnerListing): RawPartnerListing {
  return {
    ...raw,
    description: (raw.description ?? raw.title ?? "").slice(0, 280),
    images: sanitizeListingImages(raw.images).slice(0, 8),
  };
}

function readFileHead(filePath: string, bytes = 2048): string {
  const fd = openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(bytes);
    const n = readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, n).toString("utf-8");
  } finally {
    closeSync(fd);
  }
}

function loadFeedFile(source: AggregationSourceId): PartnerFeedFile | null {
  const filePath = path.join(FEED_DIR, `${source}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as PartnerFeedFile;
  } catch (err) {
    console.warn(`[aggregation] Invalid feed ${filePath}:`, err);
    return null;
  }
}

async function loadFeedFromUrl(url: string): Promise<PartnerFeedFile | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as PartnerFeedFile;
  } catch {
    return null;
  }
}

export async function fetchPartnerFeed(source: AggregationSourceId): Promise<AggregatedListing[]> {
  const cached = feedCache.get(source);
  if (cached) return cached;

  const envKey = `${source.toUpperCase().replace(/-/g, "_")}_PARTNER_FEED_URL`;
  const feedUrl = process.env[envKey];

  const feed = feedUrl ? await loadFeedFromUrl(feedUrl) : loadFeedFile(source);
  if (!feed || feed.listings.length === 0) {
    feedCache.set(source, []);
    return [];
  }

  if (feed.licenseStatus === "disabled") {
    console.warn(`[aggregation] Feed ${source} disabled by license`);
    feedCache.set(source, []);
    return [];
  }

  const listings = feed.listings
    .slice(0, MAX_FEED_LISTINGS)
    .map((raw) => normalizePartnerListing(slimRaw(raw), source, feed.licenseStatus));

  feedCache.set(source, listings);
  return listings;
}

/** Détection légère — ne parse pas le JSON complet (évite ~9 Mo au boot). */
export function hasLocalPartnerFeed(source: AggregationSourceId): boolean {
  const filePath = path.join(FEED_DIR, `${source}.json`);
  if (!existsSync(filePath)) return false;
  try {
    if (statSync(filePath).size < 80) return false;
    const head = readFileHead(filePath);
    if (/["']licenseStatus["']\s*:\s*["']disabled["']/.test(head)) return false;
    return /["']listings["']\s*:\s*\[\s*\{/.test(head);
  } catch {
    return false;
  }
}

export function getPartnerFeedPath(source: AggregationSourceId): string {
  return path.join(FEED_DIR, `${source}.json`);
}

/** Sous-ensemble filtré par ville (cache séparé pour limiter le travail de matching). */
export async function fetchPartnerFeedForCity(
  source: AggregationSourceId,
  city?: string,
): Promise<AggregatedListing[]> {
  const all = await fetchPartnerFeed(source);
  if (!city?.trim()) return all;
  const key = `${source}:${city.trim().toLowerCase()}`;
  const cached = cityFeedCache.get(key);
  if (cached) return cached;
  const needle = city.trim().toLowerCase();
  const filtered = all.filter((l) => (l.location.city ?? "").toLowerCase().includes(needle));
  cityFeedCache.set(key, filtered);
  return filtered;
}

export function resetPartnerFeedCache(): void {
  feedCache.clear();
  cityFeedCache.clear();
}
