import { NextResponse } from "next/server";
import { listAllPayments } from "@/server/repositories/payments";

type StripeEvent = {
  type: string;
  data: { object: { id: string; payment_status?: string; status?: string; metadata?: Record<string, string> } };
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();

  if (secret) {
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }
    // Production: verify with stripe.webhooks.constructEvent(body, sig, secret)
    console.info("[stripe:webhook] Signature present — verification stub (wire stripe SDK in prod)");
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(body) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const handled: string[] = [];

  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded": {
      const obj = event.data.object;
      console.info(`[stripe:webhook] Payment succeeded: ${obj.id}`, obj.metadata);
      handled.push(event.type);
      break;
    }
    case "payment_intent.payment_failed": {
      console.warn(`[stripe:webhook] Payment failed: ${event.data.object.id}`);
      handled.push(event.type);
      break;
    }
    default:
      handled.push(`ignored:${event.type}`);
  }

  return NextResponse.json({
    received: true,
    handled,
    paymentsInMemory: listAllPayments().length,
  });
}
