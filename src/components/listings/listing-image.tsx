"use client";

import { useState } from "react";
import Image from "next/image";
import { isStockListingImage } from "@/lib/media/listing-images";

const PROXY_HOSTS = new Set([
  "www.mubawab-media.com",
  "www.mubawab.ma",
  "content.avito.ma",
  "www.avito.ma",
  "sarouty-prod.s3.eu-west-3.amazonaws.com",
  "medias.yakeey.com",
  "yakeey.com",
  "agenz.ma",
  "media.agenz-failed.ma",
]);

const OPTIMIZED_HOSTS = new Set([
  "holdingimmo.com",
  "www.semsarai.ma",
  "pub-bc0f3ba210da4c89953c1aa5e465d5e1.r2.dev",
  "www.cap-property.com",
  ...PROXY_HOSTS,
]);

function resolveImageSrc(src: string): string | null {
  if (!src || isStockListingImage(src)) return null;
  if (src.startsWith("/")) return src;
  try {
    const host = new URL(src).hostname;
    if (PROXY_HOSTS.has(host)) {
      return `/api/v1/media/image?url=${encodeURIComponent(src)}`;
    }
    return src;
  } catch {
    return null;
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

function ListingImagePlaceholder({
  alt,
  fill,
  className,
}: {
  alt: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={alt || "Photo non disponible"}
      className={className}
      style={{
        ...(fill
          ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
          : undefined),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, #e8e0d4 0%, #d4cbb8 55%, #c9bfad 100%)",
        color: "rgba(28,28,26,0.45)",
      }}
    >
      <span
        style={{
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        Photo non disponible
      </span>
    </div>
  );
}

type ListingImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Image annonce — proxy Referer pour sources agrégées ; jamais de photo stock Unsplash. */
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
      setCurrentSrc(null);
    }
  };

  if (!currentSrc || failed) {
    return <ListingImagePlaceholder alt={alt} fill={fill} className={className} />;
  }

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
