import { Agent, setGlobalDispatcher } from "undici";
import { maybeSleep } from "./scrape-config";

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

let dispatcherReady = false;

/** Keep-alive + pool de connexions élevé — coupe la latence TLS. */
function ensureFastDispatcher(): void {
  if (dispatcherReady) return;
  dispatcherReady = true;
  const connections = Math.max(
    16,
    Number(process.env.SCRAPE_HTTP_CONNECTIONS ?? 96) || 96,
  );
  setGlobalDispatcher(
    new Agent({
      connections,
      pipelining: 1,
      keepAliveTimeout: 30_000,
      keepAliveMaxTimeout: 60_000,
      connect: { timeout: 8_000 },
      bodyTimeout: 20_000,
      headersTimeout: 12_000,
    }),
  );
}

export function sleep(ms: number): Promise<void> {
  return maybeSleep(ms);
}

export async function fetchText(
  url: string,
  init: RequestInit = {},
  retries = 1,
): Promise<string> {
  ensureFastDispatcher();
  let lastError: unknown;
  const maxRetries = Number(process.env.SCRAPE_HTTP_RETRIES ?? retries);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          "User-Agent": DEFAULT_UA,
          "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
          Accept: "text/html,application/json,*/*",
          Connection: "keep-alive",
          ...(init.headers ?? {}),
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }

      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await maybeSleep(Number(process.env.SCRAPE_RETRY_DELAY_MS ?? 40) * (attempt + 1));
      }
    }
  }

  throw lastError;
}

export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const text = await fetchText(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  return JSON.parse(text) as T;
}
