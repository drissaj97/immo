import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createLead, listLeads, updateLeadStatus } from "@/server/repositories/leads";

export async function GET() {
  const user = await getSession();
  if (!user || !["admin", "agent", "agency_admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const leads = await listLeads();
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const body = await request.json();
  const lead = await createLead({
    listingId: body.listingId,
    contactName: body.contactName,
    contactEmail: body.contactEmail,
    contactPhone: body.contactPhone,
    message: body.message,
    source: body.source ?? "website",
  });
  return NextResponse.json({ lead }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getSession();
  if (!user || !["admin", "agent", "agency_admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id, status } = await request.json();
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const ok = await updateLeadStatus(id, status);
  return NextResponse.json({ ok });
}
