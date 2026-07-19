import type { ReactNode } from "react"

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mb-7 flex items-center gap-2.5">
        <div className="grid size-8 flex-none place-items-center rounded-full bg-primary">
          <div className="size-3 rounded-full border-2 border-primary-foreground" />
        </div>
        <div className="font-heading text-[22px] font-bold tracking-tight">Focus</div>
      </div>

      <div className="w-full max-w-[380px] rounded-xl border border-border bg-card px-7 py-7 shadow-[var(--shadow)]">
        {children}
      </div>
    </div>
  )
}
