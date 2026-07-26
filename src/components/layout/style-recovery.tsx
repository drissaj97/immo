"use client";

import { useEffect } from "react";

const FLAG = "darbladi-style-recovery";

/**
 * Si la feuille CSS Next (_next/static/*.css) est introuvable — typiquement un
 * Service Worker qui sert du HTML obsolète après rebuild — on purge et recharge.
 */
export function StyleRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const link = document.querySelector(
      'link[rel="stylesheet"][href*="/_next/static/"]',
    ) as HTMLLinkElement | null;

    if (!link?.href) return;

    void (async () => {
      try {
        const res = await fetch(link.href, { method: "GET", cache: "no-store" });
        if (res.ok) {
          try {
            sessionStorage.removeItem(FLAG);
          } catch {
            /* ignore */
          }
          return;
        }
      } catch {
        /* network / SW failure → recover */
      }

      try {
        if (sessionStorage.getItem(FLAG) === "1") return;
        sessionStorage.setItem(FLAG, "1");
      } catch {
        return;
      }

      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* ignore */
      }
      window.location.reload();
    })();
  }, []);

  return null;
}
