import { getSession, type SessionUser } from "@/lib/auth/session";

/** Clé secrète admin (query `?key=` ou header `x-admin-key`). */
export function getAdminKey(): string | undefined {
  const key = process.env.ADMIN_KEY?.trim();
  return key || undefined;
}

export function adminKeyMatches(candidate?: string | null): boolean {
  const expected = getAdminKey();
  if (!expected || !candidate) return false;
  return candidate === expected;
}

export function isAdminUser(user: SessionUser | null | undefined): boolean {
  return Boolean(user && user.role === "admin");
}

/** Accès admin : rôle admin connecté OU clé ADMIN_KEY valide. */
export async function canAccessAdminTools(options?: {
  key?: string | null;
  request?: Request;
}): Promise<{ ok: boolean; user: SessionUser | null; viaKey: boolean }> {
  const user = await getSession();
  if (isAdminUser(user)) return { ok: true, user, viaKey: false };

  const fromHeader = options?.request?.headers.get("x-admin-key");
  const key = options?.key ?? fromHeader;
  if (adminKeyMatches(key)) return { ok: true, user, viaKey: true };

  return { ok: false, user, viaKey: false };
}

/** Afficher marques / liens partenaires (Avito, Mubawab…) — admin uniquement. */
export async function canRevealPartnerSources(key?: string | null): Promise<boolean> {
  const access = await canAccessAdminTools({ key });
  return access.ok;
}
