import { NextResponse } from "next/server";
import { authenticateUser, signToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const user = await authenticateUser(email, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signToken(user);
  return NextResponse.json({
    user,
    token,
    expiresIn: "7d",
  });
}
