import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { authenticateWithProvider } from "@/lib/auth/provider";

export type SessionUser = {
  id: string;
  email: string;
  role: "admin" | "agent" | "buyer" | "investor" | "agency_admin" | "developer";
  fullName: string;
};

const COOKIE_NAME = "darbladi_session";

function getSecret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-change-in-production-min-32-chars",
  );
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  return authenticateWithProvider(email, password);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export function requireRole(user: SessionUser | null, roles: SessionUser["role"][]) {
  if (!user || !roles.includes(user.role)) {
    throw new Error("Unauthorized");
  }
}
