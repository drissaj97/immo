import { afterEach, describe, expect, it } from "vitest";
import {
  resolveConcurrency,
  resolveDelayMs,
  scrapeSpeedMode,
} from "@/lib/scraping/scrape-config";

const ENV_KEYS = [
  "SCRAPE_FAST",
  "SCRAPE_DELAY_MS",
  "SCRAPE_CONCURRENCY",
  "SCRAPE_AGENZ_CONCURRENCY",
] as const;

const snapshot: Record<string, string | undefined> = {};

describe("scrape-config turbo", () => {
  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (snapshot[key] === undefined) delete process.env[key];
      else process.env[key] = snapshot[key];
    }
  });

  function capture() {
    for (const key of ENV_KEYS) snapshot[key] = process.env[key];
  }

  it("turbo = delay 0 et concurrence haute", () => {
    capture();
    delete process.env.SCRAPE_DELAY_MS;
    process.env.SCRAPE_FAST = "true";
    delete process.env.SCRAPE_CONCURRENCY;
    delete process.env.SCRAPE_AGENZ_CONCURRENCY;

    expect(scrapeSpeedMode()).toBe("turbo");
    expect(resolveDelayMs()).toBe(0);
    expect(resolveConcurrency("SCRAPE_AGENZ_CONCURRENCY", 32, 8)).toBe(32);
  });

  it("polite = délai et concurrence basse", () => {
    capture();
    delete process.env.SCRAPE_DELAY_MS;
    process.env.SCRAPE_FAST = "false";
    delete process.env.SCRAPE_CONCURRENCY;

    expect(scrapeSpeedMode()).toBe("polite");
    expect(resolveDelayMs()).toBe(80);
    expect(resolveConcurrency("SCRAPE_AGENZ_CONCURRENCY", 32, 8)).toBe(8);
  });
});
