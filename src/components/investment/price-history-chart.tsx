"use client";

import type { PriceHistoryPoint } from "@/lib/data/market-data";

export function PriceHistoryChart({
  history,
  currentPrice,
}: {
  history: PriceHistoryPoint[];
  currentPrice: number;
}) {
  if (history.length < 2) {
    return <p className="text-sm text-charcoal/60">Historique insuffisant.</p>;
  }

  const prices = history.map((h) => h.price);
  const min = Math.min(...prices) * 0.98;
  const max = Math.max(...prices) * 1.02;
  const range = max - min || 1;
  const width = 100;
  const height = 48;

  const points = history
    .map((h, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((h.price - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const change = ((currentPrice - history[0].price) / history[0].price) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-medium">Historique de prix</p>
        <p className={`text-sm ${change <= 0 ? "text-deep-green" : "text-bronze"}`}>
          {change >= 0 ? "+" : ""}{change.toFixed(1)} % depuis publication
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 text-deep-green" preserveAspectRatio="none">
        <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={points} />
        {history.map((h, i) => {
          const x = (i / (history.length - 1)) * width;
          const y = height - ((h.price - min) / range) * height;
          return <circle key={h.date} cx={x} cy={y} r="1.5" fill="currentColor" />;
        })}
      </svg>
      <ul className="mt-2 space-y-1 text-xs text-charcoal/60">
        {history.map((h) => (
          <li key={h.date} className="flex justify-between">
            <span>{new Date(h.date).toLocaleDateString("fr-MA")}</span>
            <span>{h.price.toLocaleString("fr-MA")} MAD {h.event ? `· ${h.event}` : ""}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-charcoal/40">Historique indicatif basé sur la date de publication</p>
    </div>
  );
}
