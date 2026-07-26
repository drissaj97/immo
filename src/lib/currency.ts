import { EXCHANGE_RATES } from "@/lib/data/demo-data";

export function convertPrice(
  amount: number,
  from: "MAD" | "EUR" | "USD",
  to: "MAD" | "EUR" | "USD",
): { amount: number; rate: number; date: string; source: string } {
  const inMad = amount / EXCHANGE_RATES[from];
  const converted = inMad * EXCHANGE_RATES[to];
  const rate = EXCHANGE_RATES[to] / EXCHANGE_RATES[from];
  return {
    amount: Math.round(converted),
    rate,
    date: EXCHANGE_RATES.date,
    source: EXCHANGE_RATES.source,
  };
}
