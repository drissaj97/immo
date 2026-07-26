import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { v4 as uuidv4 } from "uuid";

const registeredUsers: Array<{ id: string; email: string; password: string; fullName: string }> = [];

export async function POST(request: Request) {
  const { email, password, fullName } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const user = {
    id: uuidv4(),
    email,
    password,
    fullName: fullName ?? "Utilisateur",
  };
  registeredUsers.push(user);
  await createSession({ id: user.id, email: user.email, role: "buyer", fullName: user.fullName });
  return NextResponse.json({ ok: true });
}
