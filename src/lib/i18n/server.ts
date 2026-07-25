import { cookies } from "next/headers";
import { currencies, defaultLocale, locales, type Currency, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("locale")?.value as Locale | undefined;
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export async function getCurrency(): Promise<Currency> {
  const cookieStore = await cookies();
  const value = cookieStore.get("currency")?.value as Currency | undefined;
  return currencies.includes(value as Currency) ? (value as Currency) : "MAD";
}
