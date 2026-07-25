import { readFileSync, existsSync } from "fs";
import path from "path";
import type { AggregatedListing, AggregationSourceId, PartnerFeedFile, RawPartnerListing } from "../types";
import { normalizePartnerListing } from "../normalizer";

const FEED_DIR = path.join(process.cwd(), "data/feeds");
const MAX_FEED_LISTINGS = Number(process.env.PARTNER_FEED_MAX_LISTINGS ?? "3000");

const feedCache = new Map<AggregationSourceId, AggregatedListing[]>();

function slimRaw(raw: RawPartnerListing): RawPartnerListing {
  return {
    ...raw,
    description: (raw.description ?? raw.title ?? "").slice(0, 280),
    images: (raw.images ?? []).slice(0, 2),
  };
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

export function hasLocalPartnerFeed(source: AggregationSourceId): boolean {
  const feed = loadFeedFile(source);
  return Boolean(feed && feed.listings.length > 0 && feed.licenseStatus !== "disabled");
}

export function getPartnerFeedPath(source: AggregationSourceId): string {
  return path.join(FEED_DIR, `${source}.json`);
}

export function resetPartnerFeedCache(): void {
  feedCache.clear();
}
