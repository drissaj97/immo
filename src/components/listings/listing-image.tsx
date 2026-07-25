import Image from "next/image";

const OPTIMIZED_HOSTS = new Set([
  "images.unsplash.com",
  "holdingimmo.com",
  "www.semsarai.ma",
  "www.mubawab-media.com",
  "www.mubawab.ma",
  "pub-bc0f3ba210da4c89953c1aa5e465d5e1.r2.dev",
  "medias.yakeey.com",
  "yakeey.com",
  "agenz.ma",
  "media.agenz-failed.ma",
  "www.cap-property.com",
]);

function isOptimizable(src: string): boolean {
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
};

/** Image annonce — next/image si domaine connu, sinon <img> natif (agrégateur multi-sources). */
export function ListingImage({ src, alt, fill, className, sizes }: ListingImageProps) {
  if (isOptimizable(src)) {
    return <Image src={src} alt={alt} fill={fill} className={className} sizes={sizes} />;
  }

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        loading="lazy"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" />
  );
}
