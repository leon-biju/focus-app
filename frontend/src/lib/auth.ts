import { get, post } from "@/lib/api"

export interface Credentials {
  email: string
  password: string
}

// Mirrors backend's UserRead schema
export interface AuthUser {
  email: string
  created_at: string
}

export async function login(creds: Credentials): Promise<void> {
  const { access_token } = await post<{ access_token: string }>("/auth/login", creds)
  localStorage.setItem('access_token', access_token)
}

export async function register(creds: Credentials): Promise<AuthUser> {
  // Backend returns UserRead on success, 409 if the email is taken
  // TODO: on success, either auto-login (call login()) or redirect to /login
  return post<AuthUser>("/auth/register", creds)
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  if (!localStorage.getItem("access_token")) return null
  try {
    const user = await get<AuthUser>("/auth/me");
    return user;
  } catch {
    // Token is stale or invalid so drop it
    localStorage.removeItem("access_token");
    return null;
  }
}

export function logout() {
  localStorage.removeItem("access_token")
}
