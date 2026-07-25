import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { saveSimulation } from "@/server/repositories/investment";
import type { InvestmentInputs } from "@/modules/investment/calculations";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const sim = await saveSimulation(
    body.name ?? "Simulation",
    body.inputs as InvestmentInputs,
    body.scenario ?? "central",
    body.listingId,
    user.id,
  );

  return NextResponse.json(sim);
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listSimulations } = await import("@/server/repositories/investment");
  return NextResponse.json(await listSimulations(user.id));
}
