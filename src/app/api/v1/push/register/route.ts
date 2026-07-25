import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { registerPushToken } from "@/lib/push/provider";

export async function POST(request: Request) {
  const user = await getSessionFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await request.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token required (Expo push token)" }, { status: 400 });
  }

  registerPushToken(user.id, token);
  return NextResponse.json({ registered: true, userId: user.id });
}
