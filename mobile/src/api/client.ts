/** DarBladi Partner API client for mobile app */

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const API_KEY = process.env.EXPO_PUBLIC_PARTNER_API_KEY ?? "darbladi-demo-partner-key";

export type ListingSummary = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  transactionType: string;
  listingType: string;
  city: string;
  neighborhood: string;
  livingArea?: number;
  bedrooms?: number;
  isVerified: boolean;
  url: string;
};

export type ListingsResponse = {
  data: ListingSummary[];
  meta: { total: number; page: number; totalPages: number };
};

export async function fetchListings(params?: {
  city?: string;
  page?: number;
  limit?: number;
}): Promise<ListingsResponse> {
  const qs = new URLSearchParams();
  if (params?.city) qs.set("city", params.city);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE}/api/v1/listings?${qs}`, {
    headers: { "X-API-Key": API_KEY },
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<ListingsResponse>;
}

export async function fetchListing(id: string): Promise<ListingSummary | null> {
  const res = await fetch(`${API_BASE}/api/v1/listings/${id}`, {
    headers: { "X-API-Key": API_KEY },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data: ListingSummary };
  return data.data;
}

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}
