import { useState } from "react"
import type { SubmitEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth-shell"
import { login } from "@/lib/auth"

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate("/dashboard")
    } catch {
      // TODO: map backend errors (401 invalid credentials) to friendlier copy
      setError("Invalid email or password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="font-heading text-[22px] font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Pick up where you left off — no pressure.
      </p>

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
            placeholder="you@example.com"
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
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
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
        New here?{" "}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </div>
    </AuthShell>
  )
}
