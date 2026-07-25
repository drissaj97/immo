/** Stripe REST client — no SDK required; uses fetch + manual webhook verification. */

import crypto from "crypto";

export type StripeCheckoutParams = {
  amount: number;
  currency: "MAD" | "EUR" | "USD";
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
  mode?: "payment" | "subscription";
  interval?: "month" | "year";
};

export type StripeBillingPortalParams = {
  customerId: string;
  returnUrl: string;
};

export type StripeCheckoutSession = {
  id: string;
  url: string;
  paymentStatus: string;
};

function stripeAuth(): string | null {
  return process.env.STRIPE_SECRET_KEY ?? null;
}

function toStripeAmount(amount: number, currency: string): number {
  // Stripe expects smallest currency unit (centimes for MAD/EUR/USD)
  const zeroDecimal = ["jpy", "krw"].includes(currency.toLowerCase());
  return zeroDecimal ? Math.round(amount) : Math.round(amount * 100);
}

export function isStripeConfigured(): boolean {
  return Boolean(stripeAuth());
}

export async function createCheckoutSession(
  params: StripeCheckoutParams,
): Promise<StripeCheckoutSession | null> {
  const secret = stripeAuth();
  if (!secret) return null;

  const mode = params.mode ?? "payment";
  const body = new URLSearchParams({
    mode,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": params.currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]": params.description,
    "line_items[0][price_data][unit_amount]": String(
      toStripeAmount(params.amount, params.currency),
    ),
  });

  if (mode === "subscription") {
    body.set("line_items[0][price_data][recurring][interval]", params.interval ?? "month");
  }

  if (params.customerEmail) {
    body.set("customer_email", params.customerEmail);
  }

  for (const [key, value] of Object.entries(params.metadata ?? {})) {
    body.set(`metadata[${key}]`, value);
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[stripe] checkout session failed:", err);
    return null;
  }

  const data = (await res.json()) as { id: string; url: string; payment_status: string };
  return { id: data.id, url: data.url, paymentStatus: data.payment_status };
}

export async function retrieveCheckoutSession(sessionId: string): Promise<{ paid: boolean }> {
  const secret = stripeAuth();
  if (!secret) return { paid: false };

  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  if (!res.ok) return { paid: false };
  const data = (await res.json()) as { payment_status: string };
  return { paid: data.payment_status === "paid" };
}

export async function createBillingPortalSession(
  params: StripeBillingPortalParams,
): Promise<{ url: string } | null> {
  const secret = stripeAuth();
  if (!secret) return null;

  const body = new URLSearchParams({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    console.error("[stripe] billing portal failed:", await res.text());
    return null;
  }

  const data = (await res.json()) as { url: string };
  return { url: data.url };
}

export async function createStripeCustomer(email: string, metadata?: Record<string, string>): Promise<string | null> {
  const secret = stripeAuth();
  if (!secret) return null;

  const body = new URLSearchParams({ email });
  for (const [key, value] of Object.entries(metadata ?? {})) {
    body.set(`metadata[${key}]`, value);
  }

  const res = await fetch("https://api.stripe.com/v1/customers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { id: string };
  return data.id;
}

/** Verify Stripe webhook signature (HMAC-SHA256). Returns parsed event or null. */
export function verifyStripeWebhook(
  payload: string,
  signature: string,
  webhookSecret: string,
): { type: string; data: { object: Record<string, unknown> } } | null {
  const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const eq = part.indexOf("=");
    if (eq > 0) acc[part.slice(0, eq)] = part.slice(eq + 1);
    return acc;
  }, {});

  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return null;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");

  const sigBuffer = Buffer.from(v1, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(payload) as { type: string; data: { object: Record<string, unknown> } };
  } catch {
    return null;
  }
}
