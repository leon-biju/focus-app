import { useState } from "react"
import type { SubmitEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/components/auth-shell"
import { register } from "@/lib/auth"

export function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    // TODO: match backend password validation rules (see UserCreate schema)
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setSubmitting(true)
    try {
      await register({ email, password })
      // TODO: decide post-register flow — auto-login vs. redirect to /login
      navigate("/dashboard")
    } catch {
      // TODO: map 409 from POST /auth/register to "email already in use"
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="font-heading text-[22px] font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        A calmer way to plan your day starts here.
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
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Confirm password
          </label>
          <Input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            placeholder="One more time"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" disabled={submitting} className="mt-1 w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="mt-5 border-t border-linesoft pt-4 text-center text-[12.5px] text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </AuthShell>
  )
}
