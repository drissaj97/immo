"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "darbladi_cookie_consent";

export function CookieConsent({ locale }: { locale: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, analytics: true, acceptedAt: new Date().toISOString() }));
    setVisible(false);
  }

  function rejectOptional() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ essential: true, analytics: false, acceptedAt: new Date().toISOString() }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-charcoal/10 bg-ivory/95 p-4 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-charcoal/80">
          Nous utilisons des cookies essentiels et, avec votre consentement, des cookies analytiques.
          Voir notre{" "}
          <Link href={`/${locale}/conformite`} className="text-deep-green hover:underline">
            politique CNDP
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={rejectOptional}>
            Essentiels uniquement
          </Button>
          <Button size="sm" onClick={accept}>
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
