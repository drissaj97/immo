import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getPlanById, type PlanId } from "@/lib/data/plans";
import { createSubscriptionPayment, getSubscription, listPayments } from "@/server/repositories/payments";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await request.json();
  const plan = getPlanById(planId as PlanId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  if (plan.priceMonthly === 0) {
    return NextResponse.json({ plan, message: "Plan gratuit — aucun paiement requis" });
  }

  const { payment, subscription } = await createSubscriptionPayment(
    user.id,
    plan.id,
    plan.name,
    plan.priceMonthly,
  );

  return NextResponse.json({
    payment,
    subscription,
    disclaimer: "Paiement simulé — aucun prélèvement réel en mode démo.",
  });
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = getSubscription(user.id);
  const payments = listPayments(user.id).filter((p) => p.type === "subscription");
  return NextResponse.json({ subscription, payments });
}
