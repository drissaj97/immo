import { NextResponse } from "next/server";
import { verifyStripeWebhook } from "@/lib/payment/stripe-client";
import {
  completePaymentFromWebhook,
  listAllPayments,
} from "@/server/repositories/payments";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: { type: string; data: { object: Record<string, unknown> } };

  if (secret && sig) {
    const verified = verifyStripeWebhook(body, sig, secret);
    if (!verified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    event = verified;
  } else {
    try {
      event = JSON.parse(body) as typeof event;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const handled: string[] = [];

  switch (event.type) {
    case "checkout.session.completed": {
      const obj = event.data.object;
      const sessionId = String(obj.id ?? "");
      const metadata = (obj.metadata ?? {}) as Record<string, string>;
      console.info(`[stripe:webhook] Checkout completed: ${sessionId}`, metadata);
      if (sessionId) {
        completePaymentFromWebhook(sessionId, metadata);
      }
      handled.push(event.type);
      break;
    }
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
    case "invoice.paid":
    case "customer.subscription.updated": {
      const obj = event.data.object;
      console.info(`[stripe:webhook] Subscription event: ${event.type}`, obj.id, obj.metadata);
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
