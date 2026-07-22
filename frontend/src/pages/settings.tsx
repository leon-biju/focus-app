import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ToggleVisual } from "@/components/toggle-visual"
import { useTheme } from "@/components/theme-provider"

const timerDefaults = [
  { label: "Focus length", value: "40 min" },
  { label: "Short break", value: "5 min" },
  { label: "Long break", value: "20 min" },
]

const energyLabels = [
  { label: "High energy", dot: "bg-amber" },
  { label: "Steady", dot: "bg-green" },
  { label: "Low energy", dot: "bg-blue" },
]

const notifications = [
  { title: "Block start reminders", desc: "One nudge when a block begins. Never a guilt trip.", on: true },
  { title: "Break prompts", desc: "Remind me to actually stop", on: true },
  { title: "Evening check-in nudge", desc: "Daily Log reminder at 5:30 PM", on: false },
]

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="mx-auto max-w-[680px] px-11 pt-10 pb-16">
      <h1 className="mb-6 font-heading text-[28px] font-semibold tracking-tight">Settings</h1>

      <div className="flex flex-col gap-4.5">
        <div className="rounded-xl border border-border bg-card px-5.5 py-5 shadow-[var(--shadow)]">
          <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
            Timer defaults
          </div>
          <div className="mt-3.5 grid grid-cols-3 gap-3.5">
            {timerDefaults.map((t) => (
              <div key={t.label}>
                <div className="mb-1.5 text-xs text-muted-foreground">{t.label}</div>
                <div className="flex items-center rounded-lg border border-line px-3 py-2.25 font-mono text-[13px]">
                  {t.value}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3.5 flex items-center justify-between border-t border-linesoft pt-3.5">
            <div>
              <div className="text-[13.5px] font-medium">Flexible timers</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Timer bends to you — overruns don't count as failure
              </div>
            </div>
            <ToggleVisual on />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-5.5 py-5 shadow-[var(--shadow)]">
          <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
            Energy labels
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Name your levels in your own words</div>
          <div className="mt-3.5 grid grid-cols-3 gap-3.5">
            {energyLabels.map((e) => (
              <div
                key={e.label}
                className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.25"
              >
                <span className={`size-2.25 flex-none rounded-full ${e.dot}`} />
                <Input
                  defaultValue={e.label}
                  className="h-auto border-none p-0 text-[13px] shadow-none focus-visible:ring-0"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-5.5 py-5 shadow-[var(--shadow)]">
          <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
            Notifications
          </div>
          <div className="mt-1.5 flex flex-col">
            {notifications.map((n, i) => (
              <div
                key={n.title}
                className={
                  "flex items-center justify-between py-3" +
                  (i < notifications.length - 1 ? " border-b border-linesoft" : "")
                }
              >
                <div>
                  <div className="text-[13.5px] font-medium">{n.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{n.desc}</div>
                </div>
                <ToggleVisual on={n.on} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-5.5 py-5 shadow-[var(--shadow)]">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
                Daily reset
              </div>
              <div className="my-1 text-xs text-muted-foreground">When "today" rolls over</div>
              <div className="mt-2.5 inline-flex rounded-lg border border-line px-3.5 py-2.25 font-mono text-[13px]">
                4:00 AM
              </div>
            </div>
            <div>
              <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
                Theme
              </div>
              <div className="my-1 text-xs text-muted-foreground">Applies instantly</div>
              <div className="mt-2.5 inline-flex gap-0.5 rounded-[9px] border border-line p-0.75">
                <button
                  onClick={() => theme === "dark" && toggleTheme()}
                  className={`cursor-pointer rounded-[7px] px-4 py-2 text-[12.5px] font-semibold ${
                    theme === "light" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => theme === "light" && toggleTheme()}
                  className={`cursor-pointer rounded-[7px] px-4 py-2 text-[12.5px] font-semibold ${
                    theme === "dark" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-5.5 py-5 shadow-[var(--shadow)]">
          <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
            Account
          </div>
          <div className="mt-3.5 flex items-center gap-3.5">
            <Avatar className="size-10.5">
              <AvatarFallback className="bg-violet-soft font-semibold text-violet">JM</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-semibold">Jordan Miles</div>
              <div className="text-[12.5px] text-muted-foreground">jordan@example.com · Pro plan</div>
            </div>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
          <div className="mt-4 flex gap-4 border-t border-linesoft pt-3.5 text-[12.5px]">
            <a href="#" className="text-primary hover:underline">
              Export my data
            </a>
            <a href="#" className="text-destructive hover:underline">
              Delete account
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
