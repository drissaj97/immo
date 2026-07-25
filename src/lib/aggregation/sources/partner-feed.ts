import { readFileSync, existsSync } from "fs";
import path from "path";
import type { AggregatedListing, AggregationSourceId, PartnerFeedFile } from "../types";
import { normalizePartnerListing } from "../normalizer";

const FEED_DIR = path.join(process.cwd(), "data/feeds");

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
  const envKey = `${source.toUpperCase().replace(/-/g, "_")}_PARTNER_FEED_URL`;
  const feedUrl = process.env[envKey];

  const feed = feedUrl ? await loadFeedFromUrl(feedUrl) : loadFeedFile(source);
  if (!feed || feed.listings.length === 0) return [];

  if (feed.licenseStatus === "disabled") {
    console.warn(`[aggregation] Feed ${source} disabled by license`);
    return [];
  }

  return feed.listings.map((raw) =>
    normalizePartnerListing(raw, source, feed.licenseStatus),
  );
}

export function hasLocalPartnerFeed(source: AggregationSourceId): boolean {
  const feed = loadFeedFile(source);
  return Boolean(feed && feed.listings.length > 0 && feed.licenseStatus !== "disabled");
}

export function getPartnerFeedPath(source: AggregationSourceId): string {
  return path.join(FEED_DIR, `${source}.json`);
}
