import type { SubmitEvent } from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AuthShell } from "@/features/auth/auth-shell"
import { ApiError } from "@/lib/api"
import { useRegister } from "@/features/auth/use-auth"

export function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const registerMutation = useRegister()

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()

    if (password !== confirm) {
      setValidationError("Passwords don't match.")
      return
    }
    // TODO: match backend password validation rules (see UserCreate schema)
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters.")
      return
    }
    setValidationError(null)

    registerMutation.mutate(
      { email, password },
      { onSuccess: () => navigate("/dashboard") }
    )
  }

  const mutationError = registerMutation.error
    ? registerMutation.error instanceof ApiError && registerMutation.error.status === 409
      ? "That email is already in use."
      : "Something went wrong. Please try again."
    : null
  const error = validationError ?? mutationError
  const submitting = registerMutation.isPending

  return (
    <AuthShell>
      <h1 className="font-heading text-[22px] font-semibold tracking-tight">Create your account</h1>
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
          {submitting ? "Creating account..." : "Create account"}
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
