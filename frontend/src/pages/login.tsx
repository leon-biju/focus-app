import type { SubmitEvent } from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth-shell"
import { ApiError } from "@/lib/api"
import { useLogin } from "@/hooks/use-auth"

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const loginMutation = useLogin()

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loginMutation.mutate(
      { email, password },
      { onSuccess: () => navigate("/dashboard") }
    )
  }

  const error = loginMutation.error
    ? loginMutation.error instanceof ApiError && loginMutation.error.status === 401
      ? "Invalid email or password."
      : "Something went wrong. Please try again."
    : null
  const submitting = loginMutation.isPending

  return (
    <AuthShell>
      <h1 className="font-heading text-[22px] font-semibold tracking-tight">Welcome back</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Password
            </label>
            {/* TODO: forgot-password flow (no backend endpoint yet) */}
            <a href="#" className="text-xs text-primary hover:underline">
              Forgotten your password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 border-t border-linesoft pt-4 text-center text-[12.5px] text-muted-foreground">
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </div>
    </AuthShell>
  )
}
