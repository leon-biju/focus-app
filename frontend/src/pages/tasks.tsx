import { useState } from "react"
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { EnergyBadge } from "@/components/energy-badge"
import { NotesPanel } from "@/components/notes-panel"
import { toggleStepAt, useTodayTasks, useToggleMicroStep, useToggleTaskDone } from "@/hooks/use-tasks"
import type { Task } from "@/lib/tasks"
import { cn } from "@/lib/utils"

const filters = [
  { label: "All", match: () => true },
  { label: "High energy", match: (t: Task) => t.energy_tag === "high" },
  { label: "Steady", match: (t: Task) => t.energy_tag === "medium" },
  { label: "Low energy", match: (t: Task) => t.energy_tag === "low" },
  { label: "Under 15m", match: (t: Task) => t.estimate_minutes <= 15 },
]

export function TasksPage() {
  const { data: tasks, isPending, isError } = useTodayTasks()
  const toggleDone = useToggleTaskDone()
  const toggleStep = useToggleMicroStep()
  const [filter, setFilter] = useState("All")
  const [openTask, setOpenTask] = useState<string | null>(null)

  const visible = tasks?.filter(filters.find((f) => f.label === filter)!.match) ?? []
  const openCount = tasks?.filter((t) => t.status !== "done").length ?? 0

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <NotesPanel />

      {/* Tasks section (right) */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex-none px-8 pt-9 pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">Tasks</h1>
            {tasks && <span className="text-[11.5px] text-ink-3">{openCount} open</span>}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <button
                key={f.label}
                onClick={() => setFilter(f.label)}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  filter === f.label
                    ? "bg-foreground text-background"
                    : "border border-line text-muted-foreground hover:border-ink-3"
                )}
              >
                {f.label}
              </button>
            ))}
            <button className="ml-auto flex items-center gap-1.5 rounded-full bg-violet-soft px-3.5 py-2 text-[12.5px] font-semibold text-violet hover:brightness-[.96]">
              <Sparkles className="size-3.5" strokeWidth={1.8} />
              Pick for me
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-violet bg-violet-soft px-4 py-3">
            <span className="text-[13px]">
              Do this one: <strong>Review pull requests</strong>. Don't overthink it.
            </span>
            <button className="ml-auto text-xs font-semibold text-violet">Re-roll</button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-1 pb-10">
          {isPending && <p className="py-10 text-center text-[13px] text-ink-3">Loading your tasks…</p>}
          {isError && (
            <p className="py-10 text-center text-[13px] text-ink-3">
              Couldn't load your tasks. Try reloading.
            </p>
          )}

          {tasks && (
            <div className="rounded-xl border border-border bg-card shadow-[var(--shadow)]">
              {visible.map((t, i) => {
                const open = openTask === t.id
                const done = t.status === "done"
                return (
                  <div key={t.id} className={i < visible.length - 1 ? "border-b border-linesoft" : ""}>
                    <div className="flex items-center gap-3 px-4.5 py-3.5">
                      <button
                        onClick={() => toggleDone.mutate({ task: t, done: !done })}
                        aria-label={done ? `Reopen ${t.title}` : `Complete ${t.title}`}
                        className={cn(
                          "size-5 flex-none cursor-pointer rounded-md border-[1.5px] transition-colors",
                          done ? "border-primary bg-primary" : "border-line hover:border-primary"
                        )}
                      />
                      <button
                        onClick={() => setOpenTask(open ? null : t.id)}
                        className={cn(
                          "flex-1 cursor-pointer text-left text-sm font-medium",
                          done && "text-ink-3 line-through"
                        )}
                      >
                        {t.title}
                      </button>
                      <EnergyBadge level={t.energy_tag} />
                      <span className="w-9 text-right font-mono text-[11.5px] text-ink-3">
                        {t.estimate_minutes}m
                      </span>
                      {t.micro_steps.length > 0 ? (
                        open ? (
                          <ChevronUp className="size-3.5 text-ink-3" strokeWidth={1.8} />
                        ) : (
                          <ChevronDown className="size-3.5 text-ink-3" strokeWidth={1.8} />
                        )
                      ) : (
                        <span className="size-3.5" />
                      )}
                    </div>

                    {open && t.micro_steps.length > 0 && (
                      <div className="flex flex-col gap-2 py-0.5 pr-4.5 pb-3.5 pl-12.5">
                        <div className="text-[11px] font-semibold tracking-[.06em] text-ink-3 uppercase">
                          Micro-steps
                        </div>
                        {t.micro_steps.map((step, index) => (
                          <button
                            key={step.text}
                            onClick={() =>
                              toggleStep.mutate({
                                task: t,
                                micro_steps: toggleStepAt(t.micro_steps, index),
                              })
                            }
                            className="flex cursor-pointer items-center gap-2.5 text-left text-[13px] text-muted-foreground"
                          >
                            <span
                              className={cn(
                                "size-3.5 flex-none rounded-[5px] border-[1.5px] transition-colors",
                                step.done ? "border-primary bg-primary" : "border-line"
                              )}
                            />
                            <span className={cn(step.done && "text-ink-3 line-through")}>
                              {step.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {tasks.length === 0 && (
                <p className="px-4.5 py-10 text-center text-[13px] text-ink-3">
                  Nothing on today's list.
                </p>
              )}

              {tasks.length > 0 && visible.length === 0 && (
                <p className="px-4.5 py-10 text-center text-[13px] text-ink-3">
                  Nothing matches that filter.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
