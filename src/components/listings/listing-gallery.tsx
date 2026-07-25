"use client";

import Image from "next/image";
import { useState } from "react";

export function ListingGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const fallback = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";
  const safeImages = images.length > 0 ? images : [fallback];
  const current = safeImages[Math.min(active, safeImages.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sand">
        <Image
          src={current}
          alt={`${title} — photo ${active + 1}`}
          fill
          className="object-cover"
          priority={active === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {safeImages.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded bg-charcoal/70 px-2 py-1 text-xs text-ivory">
            {active + 1} / {safeImages.length}
          </span>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                i === active ? "border-deep-green" : "border-charcoal/10 hover:border-deep-green/40"
              }`}
              aria-label={`Voir photo ${i + 1}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
