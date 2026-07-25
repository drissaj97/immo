"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "darbladi_ref";

export function ReferralCapture({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    const code = ref ?? localStorage.getItem(STORAGE_KEY);
    if (ref) {
      localStorage.setItem(STORAGE_KEY, ref.toUpperCase());
    }
    if (!code) return;

    void fetch(`/${locale}/api/affiliates/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, event: "visit" }),
    });
  }, [ref, locale]);

  return null;
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
