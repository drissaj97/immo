import type { PlanId } from "@/lib/data/plans";
import { getPlanById } from "@/lib/data/plans";
import { processPayment } from "@/lib/payment/provider";

export type PaymentRecord = {
  id: string;
  userId: string;
  type: "deposit" | "subscription";
  amount: number;
  currency: "MAD";
  status: "pending" | "completed" | "failed" | "refunded";
  listingId?: string;
  planId?: PlanId;
  paymentId: string;
  provider: string;
  createdAt: string;
  isDemo: true;
};

export type SubscriptionRecord = {
  userId: string;
  planId: PlanId;
  status: "active" | "cancelled" | "past_due";
  startedAt: string;
  renewsAt: string;
  isDemo: true;
};

const paymentStore: PaymentRecord[] = [];
const subscriptionStore = new Map<string, SubscriptionRecord>();
const stripeCustomerStore = new Map<string, string>();

export function getStripeCustomerId(userId: string): string | undefined {
  return stripeCustomerStore.get(userId);
}

export function setStripeCustomerId(userId: string, customerId: string): void {
  stripeCustomerStore.set(userId, customerId);
}

export async function createDepositPayment(
  userId: string,
  listingId: string,
  listingTitle: string,
  amount: number,
): Promise<PaymentRecord> {
  const result = await processPayment({
    id: `deposit-${listingId}-${Date.now()}`,
    amount,
    currency: "MAD",
    description: `Acompte réservation — ${listingTitle}`,
    metadata: { listingId, userId, type: "deposit" },
  });

  const record: PaymentRecord = {
    id: `txn-${Date.now()}`,
    userId,
    type: "deposit",
    amount,
    currency: "MAD",
    status: result.checkoutUrl ? "pending" : result.success ? "completed" : "failed",
    listingId,
    paymentId: result.paymentId,
    provider: result.provider,
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
  paymentStore.unshift(record);
  return record;
}

export async function createSubscriptionPayment(
  userId: string,
  planId: PlanId,
  planName: string,
  amount: number,
  customerEmail?: string,
): Promise<{ payment: PaymentRecord; subscription: SubscriptionRecord; checkoutUrl?: string }> {
  const result = await processPayment({
    id: `sub-${planId}-${Date.now()}`,
    amount,
    currency: "MAD",
    description: `Abonnement ${planName}`,
    metadata: { planId, userId, type: "subscription" },
    customerEmail,
  });

  const payment: PaymentRecord = {
    id: `txn-${Date.now()}`,
    userId,
    type: "subscription",
    amount,
    currency: "MAD",
    status: result.checkoutUrl ? "pending" : result.success ? "completed" : "failed",
    planId,
    paymentId: result.paymentId,
    provider: result.provider,
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
  paymentStore.unshift(payment);

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  const subscription: SubscriptionRecord = {
    userId,
    planId,
    status: result.checkoutUrl ? "past_due" : result.success ? "active" : "past_due",
    startedAt: new Date().toISOString(),
    renewsAt: renewsAt.toISOString(),
    isDemo: true,
  };
  subscriptionStore.set(userId, subscription);

  return { payment, subscription, checkoutUrl: result.checkoutUrl };
}

/** Called by Stripe webhook when checkout.session.completed */
export function completePaymentFromWebhook(
  sessionId: string,
  metadata: Record<string, string>,
): PaymentRecord | null {
  const existing = paymentStore.find((p) => p.paymentId === sessionId);
  if (existing) {
    existing.status = "completed";
    return existing;
  }

  const userId = metadata.userId;
  const planId = metadata.planId as PlanId | undefined;
  if (!userId) return null;

  const record: PaymentRecord = {
    id: `txn-wh-${Date.now()}`,
    userId,
    type: metadata.type === "deposit" ? "deposit" : "subscription",
    amount: 0,
    currency: "MAD",
    status: "completed",
    planId,
    listingId: metadata.listingId,
    paymentId: sessionId,
    provider: "stripe",
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
  paymentStore.unshift(record);

  if (planId) {
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);
    subscriptionStore.set(userId, {
      userId,
      planId,
      status: "active",
      startedAt: new Date().toISOString(),
      renewsAt: renewsAt.toISOString(),
      isDemo: true,
    });
  }

  return record;
}

export type BillingRenewalResult = {
  userId: string;
  planId: PlanId;
  status: "renewed" | "failed" | "skipped";
  paymentId?: string;
};

/** Process MRR renewals for subscriptions past renewsAt */
export async function processSubscriptionRenewals(): Promise<BillingRenewalResult[]> {
  const now = new Date();
  const results: BillingRenewalResult[] = [];

  for (const [userId, sub] of subscriptionStore.entries()) {
    if (sub.status !== "active") {
      results.push({ userId, planId: sub.planId, status: "skipped" });
      continue;
    }

    if (new Date(sub.renewsAt) > now) {
      results.push({ userId, planId: sub.planId, status: "skipped" });
      continue;
    }

    const plan = getPlanById(sub.planId);
    if (!plan || plan.priceMonthly === 0) {
      results.push({ userId, planId: sub.planId, status: "skipped" });
      continue;
    }

    const result = await processPayment({
      id: `renew-${sub.planId}-${userId}-${Date.now()}`,
      amount: plan.priceMonthly,
      currency: "MAD",
      description: `Renouvellement ${plan.name}`,
      metadata: { planId: sub.planId, userId, type: "subscription", renewal: "true" },
    });

    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    if (result.success && !result.checkoutUrl) {
      sub.renewsAt = renewsAt.toISOString();
      paymentStore.unshift({
        id: `txn-renew-${Date.now()}`,
        userId,
        type: "subscription",
        amount: plan.priceMonthly,
        currency: "MAD",
        status: "completed",
        planId: sub.planId,
        paymentId: result.paymentId,
        provider: result.provider,
        createdAt: new Date().toISOString(),
        isDemo: true,
      });
      results.push({ userId, planId: sub.planId, status: "renewed", paymentId: result.paymentId });
    } else {
      sub.status = "past_due";
      results.push({ userId, planId: sub.planId, status: "failed" });
    }
  }

  return results;
}

export function listPayments(userId: string): PaymentRecord[] {
  return paymentStore.filter((p) => p.userId === userId);
}

export function getSubscription(userId: string): SubscriptionRecord | null {
  return subscriptionStore.get(userId) ?? null;
}

export function listAllPayments(): PaymentRecord[] {
  return [...paymentStore];
}

export function listAllSubscriptions(): SubscriptionRecord[] {
  return [...subscriptionStore.values()];
}

/** Test helper — seed an active subscription due for renewal */
export function seedSubscriptionForBillingTest(
  userId: string,
  planId: PlanId,
  renewsAtPast = true,
): void {
  const renewsAt = new Date();
  if (renewsAtPast) renewsAt.setDate(renewsAt.getDate() - 1);
  else renewsAt.setMonth(renewsAt.getMonth() + 1);

  subscriptionStore.set(userId, {
    userId,
    planId,
    status: "active",
    startedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    renewsAt: renewsAt.toISOString(),
    isDemo: true,
  });
}
