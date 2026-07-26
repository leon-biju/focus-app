import { useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "@/components/theme-provider"
import { fetchMe, updateDisplayName, updateSettings, type UserMe } from "@/lib/users"

export const userMeKey = ["users", "me"] as const

export function useMe() {
  return useQuery({
    queryKey: userMeKey,
    queryFn: fetchMe,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateSettings,
    // PATCH hands back the whole settings row, so drop it straight in instead of refetching
    onSuccess: (settings) =>
      queryClient.setQueryData<UserMe>(userMeKey, (prev) => prev && { ...prev, settings }),
  })
}

export function useUpdateDisplayName() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateDisplayName,
    onSuccess: (profile) =>
      queryClient.setQueryData<UserMe>(userMeKey, (prev) => prev && { ...prev, profile }),
  })
}

// The stored theme is only a sync target: every client paints from localStorage first
export function useThemeSync() {
  const { theme, setTheme } = useTheme()
  const { data } = useMe()
  const serverTheme = data?.settings.theme
  const adopted = useRef(false)

  useEffect(() => {
    if (!serverTheme || adopted.current) return
    adopted.current = true
    if (serverTheme !== theme) {
      setTheme(serverTheme)
    }
  }, [serverTheme, theme, setTheme])
}
