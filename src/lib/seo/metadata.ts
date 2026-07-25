import type { Metadata } from "next";

export function buildMetadata({
  title,
  description,
  path = "",
  locale = "fr",
}: {
  title: string;
  description: string;
  path?: string;
  locale?: string;
}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/${locale}${path}`;

  return {
    title: `${title} | DarBladi`,
    description,
    alternates: {
      canonical: url,
      languages: {
        fr: `${baseUrl}/fr${path}`,
        en: `${baseUrl}/en${path}`,
        ar: `${baseUrl}/ar${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "DarBladi",
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function listingJsonLd(listing: {
  title: string;
  description: string;
  price: number;
  currency: string;
  slug: string;
  images: string[];
  city: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description,
    url: `${baseUrl}/fr/biens/${listing.slug}`,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency,
    },
    image: listing.images[0],
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.city,
      addressCountry: "MA",
    },
  };
}
