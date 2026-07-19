// All api communications come through this


const BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = localStorage.getItem('access_token');

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
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.detail ?? response.statusText)
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
