import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { calculateDepositAmount } from "@/lib/data/plans";
import { createDepositPayment } from "@/server/repositories/payments";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { listingId, listingTitle, price } = body;
  if (!listingId || !price) {
    return NextResponse.json({ error: "listingId and price required" }, { status: 400 });
  }

  const amount = calculateDepositAmount(Number(price));
  const payment = await createDepositPayment(
    user.id,
    listingId,
    listingTitle ?? "Bien immobilier",
    amount,
  );

  return NextResponse.json({
    payment,
    disclaimer: "Paiement simulé — aucun prélèvement réel en mode démo.",
  });
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listPayments } = await import("@/server/repositories/payments");
  const payments = listPayments(user.id).filter((p) => p.type === "deposit");
  return NextResponse.json({ reservations: payments });
}
