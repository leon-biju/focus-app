import { MutationCache, QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      // Forms that render errors inline set this so the global toast stays quiet
      suppressErrorToast?: boolean
    }
  }
}

// A 4xx error means it's the client request's fault so no point retrying
// Only retry for server errors and network blips, and only upto a certain point
function retry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) {
    return false
  
  }
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry,
      staleTime: 30_000,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressErrorToast) return
      toast.error(
        error instanceof ApiError ? error.detail : "Something went wrong. Please try again."
      )
    },
  }),
})
