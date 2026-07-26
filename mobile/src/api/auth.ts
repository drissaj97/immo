const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

let memoryToken: string | null = null;

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  fullName: string;
};

export async function getStoredToken(): Promise<string | null> {
  return memoryToken;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Identifiants invalides");
  const data = (await res.json()) as { user: AuthUser; token: string };
  memoryToken = data.token;
  return data;
}

export async function logout(): Promise<void> {
  memoryToken = null;
}

export async function getMe(): Promise<AuthUser | null> {
  const token = await getStoredToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    await logout();
    return null;
  }
  const data = (await res.json()) as { user: AuthUser };
  return data.user;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
