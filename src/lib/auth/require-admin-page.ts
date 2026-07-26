import { redirect } from "next/navigation";
import { canAccessAdminTools } from "@/lib/auth/admin-access";

/** Protège une page admin ; accepte aussi `?key=ADMIN_KEY`. */
export async function requireAdminPage(
  locale: string,
  searchParams?: Record<string, string | string[] | undefined>,
  options?: { nextPath?: string },
) {
  const rawKey = searchParams?.key;
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
  const access = await canAccessAdminTools({ key });
  if (!access.ok) {
    const next = options?.nextPath ?? `/${locale}/admin`;
    redirect(`/${locale}/connexion?next=${encodeURIComponent(next)}`);
  }
  return access;
}
