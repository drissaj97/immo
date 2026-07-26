"use client";

import { useEffect } from "react";

/**
 * Désactive le Service Worker par défaut.
 * L'ancien SW cachait le HTML et cassait le CSS après chaque rebuild.
 * Opt-in uniquement via NEXT_PUBLIC_ENABLE_PWA=true.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const enablePwa = process.env.NEXT_PUBLIC_ENABLE_PWA === "true";

    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (!enablePwa) {
          await Promise.all(regs.map((r) => r.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(
              keys.filter((k) => k.startsWith("darbladi")).map((k) => caches.delete(k)),
            );
          }
          return;
        }
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return null;
}
