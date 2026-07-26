import { NextResponse } from "next/server";
import { createBillingPortalSession, createStripeCustomer, isStripeConfigured } from "@/lib/payment/stripe-client";
import { getSession } from "@/lib/auth/session";
import { getStripeCustomerId, setStripeCustomerId } from "@/server/repositories/payments";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({
      url: null,
      message: "Stripe non configuré — portail facturation indisponible en mode démo.",
    });
  }

  let customerId = getStripeCustomerId(user.id);
  if (!customerId) {
    customerId = (await createStripeCustomer(user.email, { userId: user.id })) ?? undefined;
    if (customerId) setStripeCustomerId(user.id, customerId);
  }

  if (!customerId) {
    return NextResponse.json({ error: "Failed to create Stripe customer" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const portal = await createBillingPortalSession({
    customerId,
    returnUrl: `${appUrl}/fr/dashboard/facturation`,
  });

  if (!portal) {
    return NextResponse.json({ error: "Billing portal unavailable" }, { status: 503 });
  }

  return NextResponse.json({ url: portal.url });
}
