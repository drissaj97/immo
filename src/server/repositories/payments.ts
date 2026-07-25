import type { PlanId } from "@/lib/data/plans";
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
    status: result.success ? "completed" : "failed",
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
): Promise<{ payment: PaymentRecord; subscription: SubscriptionRecord }> {
  const result = await processPayment({
    id: `sub-${planId}-${Date.now()}`,
    amount,
    currency: "MAD",
    description: `Abonnement ${planName}`,
    metadata: { planId, userId, type: "subscription" },
  });

  const payment: PaymentRecord = {
    id: `txn-${Date.now()}`,
    userId,
    type: "subscription",
    amount,
    currency: "MAD",
    status: result.success ? "completed" : "failed",
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
    status: result.success ? "active" : "past_due",
    startedAt: new Date().toISOString(),
    renewsAt: renewsAt.toISOString(),
    isDemo: true,
  };
  subscriptionStore.set(userId, subscription);

  return { payment, subscription };
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
