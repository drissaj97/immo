import { NextResponse } from "next/server";
import { authenticateUser, createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await authenticateUser(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await createSession(user);
  return NextResponse.json({ user });
}
