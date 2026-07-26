"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

/** Page de secours : purge SW + caches puis renvoie à l'accueil. */
export default function ResetCachePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fr";
  const [status, setStatus] = useState("Nettoyage en cours…");

  useEffect(() => {
    void (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        try {
          sessionStorage.clear();
          localStorage.removeItem("darbladi-last-search");
        } catch {
          /* ignore */
        }
        setStatus("Cache vidé. Redirection…");
        window.setTimeout(() => {
          window.location.replace(`/${locale}?nocache=${Date.now()}`);
        }, 600);
      } catch {
        setStatus("Erreur — rechargez avec Ctrl+Shift+R");
      }
    })();
  }, [locale]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-serif text-3xl">Réparation du site</h1>
      <p className="text-charcoal/70">{status}</p>
      <Link href={`/${locale}`} className="text-deep-green underline">
        Retour à l’accueil
      </Link>
    </div>
  );
}
