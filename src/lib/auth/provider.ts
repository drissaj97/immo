import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { DEMO_USERS } from "@/lib/data/demo-data";
import { getDb } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { useDatabase } from "@/lib/db/repository";
import type { SessionUser } from "@/lib/auth/session";

export type AuthProvider = "jwt" | "supabase";

export function getAuthProvider(): AuthProvider {
  const provider = process.env.AUTH_PROVIDER ?? "jwt";
  return provider === "supabase" ? "supabase" : "jwt";
}

async function authenticateFromDb(email: string, password: string): Promise<SessionUser | null> {
  const db = getDb();
  if (!db) return null;

  const [row] = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.email, email))
    .limit(1);

  if (!row) return null;
  const valid = await bcrypt.compare(password, row.user.passwordHash);
  if (!valid) return null;

  return {
    id: row.user.id,
    email: row.user.email,
    role: row.user.role as SessionUser["role"],
    fullName: row.profile?.fullName ?? row.user.email.split("@")[0],
  };
}

async function authenticateFromDemo(email: string, password: string): Promise<SessionUser | null> {
  const user = DEMO_USERS.find((u) => u.email === email);
  if (!user || user.password !== password) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };
}

/** Supabase Auth stub — wire @supabase/supabase-js when AUTH_PROVIDER=supabase */
async function authenticateFromSupabase(_email: string, _password: string): Promise<SessionUser | null> {
  console.warn("[auth] Supabase provider configured but not yet wired — falling back to JWT/demo");
  return null;
}

export async function authenticateWithProvider(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const provider = getAuthProvider();

  if (provider === "supabase" && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const supabaseUser = await authenticateFromSupabase(email, password);
    if (supabaseUser) return supabaseUser;
  }

  if (useDatabase()) {
    const dbUser = await authenticateFromDb(email, password);
    if (dbUser) return dbUser;
  }

  return authenticateFromDemo(email, password);
}
