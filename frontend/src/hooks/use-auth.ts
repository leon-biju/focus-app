import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchCurrentUser, login, logout, register, type Credentials } from "@/lib/auth"

export const currentUserKey = ["auth", "user"] as const

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: fetchCurrentUser,
    // fetchCurrentUser is null (never throws) if logged out, and
    // login/logout mutations keep this entry in sync so no background refetching needed.
    staleTime: Infinity,
    retry: false,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (creds: Credentials) => {
      await login(creds)
      return fetchCurrentUser()
    },
    onSuccess: (user) => queryClient.setQueryData(currentUserKey, user),
    meta: { suppressErrorToast: true },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (creds: Credentials) => {
      await register(creds)
      // Just log the user in bro
      await login(creds)
      return fetchCurrentUser()
    },
    onSuccess: (user) => queryClient.setQueryData(currentUserKey, user),
    meta: { suppressErrorToast: true },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Drop all cached queries (it all belonged to this user), then mark the
      // session anonymous so RequireAuth redirects without a refetch round-trip.
      queryClient.clear()
      queryClient.setQueryData(currentUserKey, null)
    },
  })
}
