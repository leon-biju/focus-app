// All api communications come through this


const BASE_URL: string = import.meta.env.VITE_API_URL ?? "/api"

// The access token lives here as a variable so an XSS can't steal it from storage. 
// Losing it on reload is fine since the refresh cookie gets a new one via /auth/refresh.
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in_sec: number
}

// Just refresh in one go rather than riskinga  refresh race
// Two refresh's badly timed could cause a relogin if the token family gets nuked
let refreshPromise: Promise<boolean> | null = null

export function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      // Raw fetch, not request(): a 401 here must not trigger another refresh.
      const response = await fetch(`${BASE_URL}/auth/refresh`, { method: "POST" })
      if (!response.ok) {
        setAccessToken(null)
        return false
      }
      const body = (await response.json()) as TokenResponse
      setAccessToken(body.access_token)
      return true
    } catch {
      setAccessToken(null)
      return false
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}

// The custom HTTPExceptions put a plain string in detail, but a 422 from pydantic request validation
// puts an array of error objects there, which would otherwise toast as "[object Object]"
function readDetail(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === "string") {
    return detail
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item as { msg?: unknown }).msg)
      .filter((msg): msg is string => typeof msg === "string")
    if (messages.length) {
      // Pydantic prefixes value errors with "Value error, " which reads like noise here
      return messages.map((msg) => msg.replace(/^Value error, /, "")).join(". ")
    }
  }
  return fallback
}

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(accessToken && {
      Authorization: `Bearer ${accessToken}`
    }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Expired access token: refresh once and retry. 
    // But if it was a Login/refresh then that means we are defo unauthorised not just
    // a stale token
    const refreshable = response.status === 401 && !retried
      && path !== "/auth/login" && path !== "/auth/refresh";
    if (refreshable && await refreshAccessToken()) {
      return request<T>(path, options, true);
    }
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, readDetail(body, response.statusText))
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>

}

export function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export function del<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" })
}
