"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { locales, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();

  return (
    <Select
      value={locale}
      onChange={(e) => {
        document.cookie = `locale=${e.target.value};path=/;max-age=31536000`;
        router.refresh();
      }}
      aria-label="Langue"
      className="w-auto min-w-[4rem]"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </Select>
  );
}
