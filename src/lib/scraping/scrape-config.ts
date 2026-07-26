/**
 * Config scrape « turbo » — zéro latence artificielle, forte concurrence.
 *
 * Override :
 *   SCRAPE_DELAY_MS=0
 *   SCRAPE_CONCURRENCY=32
 *   SCRAPE_AGENZ_CONCURRENCY=32
 *   SCRAPE_FAST=false  → mode prudent (délai 80ms, concurrence basse)
 */

export type ScrapeSpeedMode = "turbo" | "polite";

export function scrapeSpeedMode(): ScrapeSpeedMode {
  const raw = (process.env.SCRAPE_FAST ?? "true").toLowerCase();
  if (raw === "0" || raw === "false" || raw === "polite" || raw === "off") {
    return "polite";
  }
  return "turbo";
}

export function resolveDelayMs(override?: number): number {
  if (override != null) return Math.max(0, override);
  if (process.env.SCRAPE_DELAY_MS != null && process.env.SCRAPE_DELAY_MS !== "") {
    return Math.max(0, Number(process.env.SCRAPE_DELAY_MS) || 0);
  }
  return scrapeSpeedMode() === "turbo" ? 0 : 80;
}

export function resolveConcurrency(
  envKey: string,
  turboDefault: number,
  politeDefault: number,
): number {
  const fromEnv = process.env[envKey] ?? process.env.SCRAPE_CONCURRENCY;
  if (fromEnv != null && fromEnv !== "") {
    return Math.max(1, Number(fromEnv) || turboDefault);
  }
  return scrapeSpeedMode() === "turbo" ? turboDefault : politeDefault;
}

export function maybeSleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function logScrapeSpeedBanner(): void {
  const mode = scrapeSpeedMode();
  const delay = resolveDelayMs();
  const concurrency = resolveConcurrency("SCRAPE_CONCURRENCY", 32, 8);
  console.info(
    `[scrape] mode=${mode} delayMs=${delay} concurrency≈${concurrency} parallelPortals=${process.env.SCRAPE_PARALLEL !== "false"}`,
  );
}
