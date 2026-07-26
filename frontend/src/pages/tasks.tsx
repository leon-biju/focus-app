import { useState, type KeyboardEvent } from "react"
import { ChevronDown, ChevronUp, ListChecks, Pencil, Plus } from "lucide-react"
import { EnergyBadge } from "@/components/energy-badge"
import { NotesPanel } from "@/components/notes-panel"
import { TaskDialog } from "@/components/task-dialog"
import { Button } from "@/components/ui/button"
import { useFlipList } from "@/hooks/use-flip-list"
import { toggleStepAt, useTodayTasks, useToggleMicroStep, useToggleTaskDone } from "@/hooks/use-tasks"
import type { Task } from "@/lib/tasks"
import { cn } from "@/lib/utils"

const filters = [
  { label: "All", match: () => true },
  { label: "High energy", match: (t: Task) => t.energy_tag === "high" },
  { label: "Medium energy", match: (t: Task) => t.energy_tag === "medium" },
  { label: "Low energy", match: (t: Task) => t.energy_tag === "low" },
  { label: "Under 15m", match: (t: Task) => t.estimate_minutes <= 15 },
]

export function TasksPage() {
  const { data: tasks, isPending, isError } = useTodayTasks()
  const toggleDone = useToggleTaskDone()
  const toggleStep = useToggleMicroStep()
  const [filter, setFilter] = useState("All")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  // undefined = closed, null = creating, a task = editing that one
  const [editing, setEditing] = useState<Task | null | undefined>(undefined)
  const registerRow = useFlipList()

  const visible = tasks?.filter(filters.find((f) => f.label === filter)!.match) ?? []
  const openCount = tasks?.filter((t) => t.status !== "done").length ?? 0

  // Any number of tasks can sit open at once
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const onRowKeyDown = (event: KeyboardEvent, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      toggleExpanded(id)
    }
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* A promoted note arrives as a bare task, so open it for the details right away */}
      <NotesPanel onPromoted={(task) => setEditing(task)} />

      {/* Tasks section (right) */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex-none px-8 pt-9 pb-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">Tasks</h1>
            <div className="flex items-center gap-3">
              {tasks && <span className="text-[11.5px] text-ink-3">{openCount} open</span>}
              <Button size="sm" onClick={() => setEditing(null)}>
                <Plus />
                New task
              </Button>
            </div>
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
                const expandable = t.micro_steps.length > 0
                const open = expandable && expanded.has(t.id)
                const done = t.status === "done"
                const stepsDone = t.micro_steps.filter((s) => s.done).length
                return (
                  <div
                    key={t.id}
                    ref={registerRow(t.id)}
                    className={i < visible.length - 1 ? "border-b border-linesoft" : ""}
                  >
                    {/* The whole row expands, so the checkbox has to keep its click to itself */}
                    <div
                      role={expandable ? "button" : undefined}
                      tabIndex={expandable ? 0 : undefined}
                      aria-expanded={expandable ? open : undefined}
                      onClick={expandable ? () => toggleExpanded(t.id) : undefined}
                      onKeyDown={expandable ? (e) => onRowKeyDown(e, t.id) : undefined}
                      className={cn(
                        "group flex items-center gap-3 px-4.5 py-3.5",
                        expandable && "cursor-pointer"
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDone.mutate({ task: t, done: !done })
                        }}
                        aria-label={done ? `Reopen ${t.title}` : `Complete ${t.title}`}
                        className={cn(
                          "size-5 flex-none cursor-pointer rounded-md border-[1.5px] transition-colors",
                          done ? "border-primary bg-primary" : "border-line hover:border-primary"
                        )}
                      />
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            done && "text-ink-3 line-through"
                          )}
                        >
                          {t.title}
                        </span>
                        {/* Steps are the whole point of the row expanding, so say so next to the title */}
                        {expandable && (
                          <span
                            className={cn(
                              "flex flex-none items-center gap-1 rounded-full px-1.5 py-[2px] font-mono text-[11px]",
                              stepsDone === t.micro_steps.length
                                ? "bg-green-soft text-green"
                                : "bg-muted text-ink-3"
                            )}
                          >
                            <ListChecks className="size-3" strokeWidth={2} />
                            {stepsDone}/{t.micro_steps.length}
                          </span>
                        )}
                      </span>
                      <EnergyBadge level={t.energy_tag} />
                      <span className="w-9 text-right font-mono text-[11.5px] text-ink-3">
                        {t.estimate_minutes}m
                      </span>
                      {/* Quiet until you're on the row, but never hidden from the keyboard */}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Edit ${t.title}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditing(t)
                        }}
                        className="text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-ink"
                      >
                        <Pencil />
                      </Button>
                      {expandable ? (
                        open ? (
                          <ChevronUp
                            className="size-3.5 text-ink-3 transition-colors group-hover:text-ink"
                            strokeWidth={1.8}
                          />
                        ) : (
                          <ChevronDown
                            className="size-3.5 text-ink-3 transition-colors group-hover:text-ink"
                            strokeWidth={1.8}
                          />
                        )
                      ) : (
                        <span className="size-3.5" />
                      )}
                    </div>

                    {open && (
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
                <div className="flex flex-col items-center gap-3 px-4.5 py-10">
                  <p className="text-[13px] text-ink-3">Nothing on today's list.</p>
                  <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
                    <Plus />
                    Add the first one
                  </Button>
                </div>
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

      <TaskDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        task={editing ?? undefined}
      />
    </div>
  )
}
