import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { uploadListingMedia } from "@/lib/storage/provider";

export async function POST(request: Request) {
  const user = await getSession();
  if (!user || !["agent", "admin", "agency_admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 5 MB" }, { status: 400 });
  }

  try {
    const result = await uploadListingMedia(file, file.name, file.type || "image/jpeg");
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
