import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { approveListing } from "@/server/repositories/listings";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ locale: string; id: string }> },
) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const ok = await approveListing(id);
  return NextResponse.json({ ok });
}
