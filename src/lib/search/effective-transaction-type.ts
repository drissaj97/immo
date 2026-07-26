export type ListingTransactionType = "sale" | "long_term_rent" | "short_term_rent";

/** Au-delà, un prix MAD est presque toujours une vente (hors terrains hors norme). */
export const RENT_PRICE_CEILING_MAD = 80_000;

/** En dessous, un bien tagué « vente » sans signal texte est souvent une location mensuelle. */
export const SALE_PRICE_FLOOR_MAD = 200_000;

type ListingLike = {
  transactionType: ListingTransactionType;
  title: string;
  description?: string | null;
  price: number;
  listingType?: string | null;
};

function listingText(listing: ListingLike): string {
  return `${listing.title} ${listing.description ?? ""}`.toLowerCase();
}

export function textImpliesTransaction(
  listing: Pick<ListingLike, "title" | "description">,
): ListingTransactionType | null {
  const text = listingText(listing as ListingLike);
  const sale = /à vendre|a vendre|vente d['’ ]|for sale|immobilier-a-vendre|\/a-vendre/.test(
    text,
  );
  const rent =
    /à louer|a louer|location d['’ ]|for rent|immobilier-a-louer|\/a-louer|\/mois|par mois/.test(
      text,
    );
  if (sale && !rent) return "sale";
  if (rent && !sale) return "long_term_rent";
  return null;
}

/**
 * Corrige les mauvais tags portails (ex. studio 5 500 MAD tagué « sale »).
 * Utilisé pour filtres Louer/Acheter et badges carte.
 */
export function effectiveTransactionType(listing: ListingLike): ListingTransactionType {
  const implied = textImpliesTransaction(listing);
  if (implied === "sale") return "sale";
  if (implied === "long_term_rent") {
    return listing.transactionType === "short_term_rent"
      ? "short_term_rent"
      : "long_term_rent";
  }

  const isLand = listing.listingType === "land";
  const price = listing.price;

  if (
    listing.transactionType === "sale" &&
    !isLand &&
    price > 0 &&
    price < RENT_PRICE_CEILING_MAD
  ) {
    return "long_term_rent";
  }

  if (
    (listing.transactionType === "long_term_rent" ||
      listing.transactionType === "short_term_rent") &&
    price >= SALE_PRICE_FLOOR_MAD &&
    /à vendre|a vendre|vente d['’ ]/.test(listingText(listing))
  ) {
    return "sale";
  }

  return listing.transactionType;
}

/** true si le bien doit apparaître pour le filtre de recherche donné. */
export function matchesTransactionFilter(
  listing: ListingLike,
  filter: ListingTransactionType,
): boolean {
  const effective = effectiveTransactionType(listing);
  if (filter === "long_term_rent") {
    return effective === "long_term_rent" || effective === "short_term_rent";
  }
  if (filter === "short_term_rent") {
    return effective === "short_term_rent";
  }
  return effective === "sale";
}
