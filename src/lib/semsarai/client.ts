import type { SemsaraiPropertiesResponse } from "./types";

const DEFAULT_API = "https://server-production-a8d0.up.railway.app";

export type FetchSemsaraiOptions = {
  page?: number;
  limit?: number;
  apiUrl?: string;
};

export async function fetchSemsaraiProperties(
  options: FetchSemsaraiOptions = {},
): Promise<SemsaraiPropertiesResponse> {
  const apiUrl = options.apiUrl ?? process.env.SEMSARAI_API_URL ?? DEFAULT_API;
  const page = options.page ?? 1;
  const limit = options.limit ?? 50;

  const res = await fetch(`${apiUrl}/operations/get-properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "DarBladi-Import/1.0",
    },
    body: JSON.stringify({ json: { page, limit } }),
  });

  if (!res.ok) {
    throw new Error(`Semsarai API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { json: SemsaraiPropertiesResponse };
  return data.json;
}
