import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { fetchCurrentUser } from "@/lib/auth"

type AuthStatus = "checking" | "authed" | "anon"

export function RequireAuth() {
  const [status, setStatus] = useState<AuthStatus>("checking")

  useEffect(() => {
    fetchCurrentUser().then((user) => setStatus(user ? "authed" : "anon"))
  }, [])

  if (status === "checking") {
    return null
  }
  
  if (status === "anon") {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
