import type { SemsaraiPropertiesResponse } from "./types";

const DEFAULT_API = "https://server-production-a8d0.up.railway.app";
const CACHE_TTL_MS = Number(process.env.SEMSARAI_CACHE_TTL_MS ?? "900000"); // 15 min
const FETCH_TIMEOUT_MS = Number(process.env.SEMSARAI_FETCH_TIMEOUT_MS ?? "4000");

export type FetchSemsaraiOptions = {
  page?: number;
  limit?: number;
  apiUrl?: string;
};

type CacheEntry = { data: SemsaraiPropertiesResponse; expires: number };

const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<SemsaraiPropertiesResponse>>();

function cacheKey(page: number, limit: number, apiUrl: string): string {
  return `${apiUrl}|${page}|${limit}`;
}

async function fetchFromApi(
  page: number,
  limit: number,
  apiUrl: string,
): Promise<SemsaraiPropertiesResponse> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`${apiUrl}/operations/get-properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "DarBladi-Import/1.0",
        },
        body: JSON.stringify({ json: { page, limit } }),
        signal: controller.signal,
      });

      if (!res.ok) {
        if (res.status >= 500 && attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        throw new Error(`Semsarai API ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as { json: SemsaraiPropertiesResponse };
      return data.json;
    } catch (err) {
      lastError = err;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export async function fetchSemsaraiProperties(
  options: FetchSemsaraiOptions = {},
): Promise<SemsaraiPropertiesResponse> {
  const apiUrl = options.apiUrl ?? process.env.SEMSARAI_API_URL ?? DEFAULT_API;
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;
  const key = cacheKey(page, limit, apiUrl);
  const now = Date.now();

  const cached = responseCache.get(key);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = fetchFromApi(page, limit, apiUrl)
    .then((data) => {
      responseCache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

export function clearSemsaraiApiCache(): void {
  responseCache.clear();
  inflight.clear();
}
