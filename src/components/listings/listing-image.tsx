"use client";

import { useState } from "react";
import Image from "next/image";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

const PROXY_HOSTS = new Set([
  "www.mubawab-media.com",
  "www.mubawab.ma",
  "medias.yakeey.com",
  "yakeey.com",
  "agenz.ma",
  "media.agenz-failed.ma",
]);

const OPTIMIZED_HOSTS = new Set([
  "images.unsplash.com",
  "holdingimmo.com",
  "www.semsarai.ma",
  "pub-bc0f3ba210da4c89953c1aa5e465d5e1.r2.dev",
  "www.cap-property.com",
  ...PROXY_HOSTS,
]);

function resolveImageSrc(src: string): string {
  if (!src || src.startsWith("/")) return src || PLACEHOLDER;
  try {
    const host = new URL(src).hostname;
    if (PROXY_HOSTS.has(host)) {
      return `/api/v1/media/image?url=${encodeURIComponent(src)}`;
    }
    return src;
  } catch {
    return PLACEHOLDER;
  }
}

function isNextImage(src: string): boolean {
  if (src.startsWith("/api/")) return false;
  try {
    return OPTIMIZED_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

type ListingImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Image annonce — proxy Referer pour sources agrégées + fallback si erreur. */
export function ListingImage({
  src,
  alt,
  fill,
  className,
  sizes,
  priority,
}: ListingImageProps) {
  const [currentSrc, setCurrentSrc] = useState(() => resolveImageSrc(src));
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!failed) {
      setFailed(true);
      setCurrentSrc(PLACEHOLDER);
    }
  };

  if (isNextImage(currentSrc)) {
    return (
      <Image
        src={currentSrc}
        alt={alt}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
        onError={handleError}
      />
    );
  }

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
