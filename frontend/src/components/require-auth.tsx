import { Navigate, Outlet } from "react-router-dom"
import { useCurrentUser } from "@/hooks/use-auth"

export function RequireAuth() {
  const { data: user, isPending } = useCurrentUser()

  if (isPending) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
