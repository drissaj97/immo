type BrandLogoProps = {
  /** Variante compacte (icône seule) ou logo complet. */
  variant?: "full" | "mark";
  /** `light` pour fonds sombres (footer). */
  tone?: "default" | "light";
  className?: string;
  priority?: boolean;
};

/** Logo DarBladi — header / footer. */
export function BrandLogo({
  variant = "full",
  tone = "default",
  className = "",
  priority = false,
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/darbladi-mark.svg"
        alt="DarBladi"
        width={36}
        height={36}
        className={className}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
      />
    );
  }

  const src =
    tone === "light" ? "/brand/darbladi-logo-light.svg" : "/brand/darbladi-logo.svg";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="DarBladi"
      width={168}
      height={36}
      className={`h-9 w-auto ${className}`}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
