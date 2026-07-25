"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/input";
import { currencies } from "@/lib/i18n/config";

export function CurrencySwitcher() {
  const router = useRouter();

  return (
    <Select
      defaultValue="MAD"
      onChange={(e) => {
        document.cookie = `currency=${e.target.value};path=/;max-age=31536000`;
        router.refresh();
      }}
      aria-label="Devise"
      className="w-auto min-w-[4.5rem]"
    >
      {currencies.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </Select>
  );
}
