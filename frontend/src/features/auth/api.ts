import { get, post, getAccessToken, setAccessToken, refreshAccessToken } from "@/lib/api"

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
  // The backend will also automatically set the refresh cookie for us
  const { access_token } = await post<{ access_token: string }>("/auth/login", creds)
  setAccessToken(access_token)
}

export async function register(creds: Credentials): Promise<AuthUser> {
  // Backend returns UserRead on success, 409 if the email is taken
  // TODO: on success, either auto-login (call login()) or redirect to /login
  return post<AuthUser>("/auth/register", creds)
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {

  if (!getAccessToken() && !(await refreshAccessToken())) {
    // no access nor refresh cookie yeah we're logged out alright
    return null
  }
  try {
    // we have an access token if /auth/me responds
    return await get<AuthUser>("/auth/me")
  } catch {
    setAccessToken(null)
    return null
  }
}

export async function logout(): Promise<void> {
  try {
    // Revokes the refresh token server-side and clears the cookie
    await post("/auth/logout")
  } finally {
    setAccessToken(null)
  }
}
