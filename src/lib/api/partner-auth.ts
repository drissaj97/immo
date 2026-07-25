export type PartnerIdentity = {
  keyId: string;
  partnerName: string;
};

const DEMO_KEYS: Record<string, PartnerIdentity> = {
  "darbladi-demo-partner-key": { keyId: "demo", partnerName: "Partenaire Démo" },
  "samsar-demo-partner-key": { keyId: "legacy", partnerName: "Partenaire Démo (legacy)" },
};

function loadPartnerKeys(): Record<string, PartnerIdentity> {
  const keys: Record<string, PartnerIdentity> = { ...DEMO_KEYS };
  const envKeys = process.env.PARTNER_API_KEYS;
  if (!envKeys) return keys;

  for (const entry of envKeys.split(",")) {
    const [apiKey, partnerName] = entry.split(":").map((s) => s.trim());
    if (apiKey && partnerName) {
      keys[apiKey] = { keyId: apiKey.slice(0, 8), partnerName };
    }
  }
  return keys;
}

export function extractApiKey(request: Request): string | null {
  const header = request.headers.get("x-api-key");
  if (header) return header;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  return null;
}

export function authenticatePartner(request: Request): PartnerIdentity | null {
  const apiKey = extractApiKey(request);
  if (!apiKey) return null;
  const keys = loadPartnerKeys();
  return keys[apiKey] ?? null;
}

export function getPublicApiVersion(): string {
  return "1.0.0";
}
