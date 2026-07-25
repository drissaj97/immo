"use client";

import { useEffect } from "react";

async function clearStaleServiceWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // En dev / après rebuilds, les SW qui cachent le HTML cassent tout le CSS.
    if (process.env.NODE_ENV !== "production") {
      void clearStaleServiceWorkers();
      return;
    }

    void (async () => {
      try {
        // Purge une fois les anciens caches darbladi-v1 / v2 qui stockaient le HTML
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k.startsWith("darbladi-") && k !== "darbladi-v3-assets")
            .map((k) => caches.delete(k)),
        );
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return null;
}
