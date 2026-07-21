import { useState } from "react"
import { ChevronDown, ChevronUp, ListPlus, Sparkles, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { EnergyBadge, type EnergyLevel } from "@/components/energy-badge"
import { cn } from "@/lib/utils"

type Note = {
  id: number
  body: string
  createdAt: Date
}

type Task = {
  id: number
  name: string
  energy: EnergyLevel
  minutes: number
  steps?: string[]
  done?: boolean
}

const minsAgo = (m: number) => new Date(Date.now() - m * 60_000)

const seedNotes: Note[] = [
  { id: 1, body: "Ana mentioned the offsite needs a rough agenda before Friday — 3 sessions max.", createdAt: minsAgo(4) },
  { id: 2, body: "Dentist. Left molar. Stop putting this off.", createdAt: minsAgo(38) },
  { id: 3, body: "Idea: the brief should open with the three decisions it answers, not background.", createdAt: minsAgo(96) },
  { id: 4, body: "Inbox is at 200+ again. Batch it rather than trickling all day.", createdAt: minsAgo(310) },
  { id: 5, body: "Energy dips hard around 2pm — stop scheduling deep work there.", createdAt: minsAgo(1500) },
  { id: 6, body: "Ask about the staging DB backup schedule.", createdAt: minsAgo(1660) },
  { id: 7, body: "Book the flights before the fares jump again.", createdAt: minsAgo(2900) },
]

const seedTasks: Task[] = [
  {
    id: 1,
    name: "Draft Q3 project brief",
    energy: "high",
    minutes: 50,
    steps: [
      "Open the doc, write one ugly sentence",
      "List the 3 decisions it must answer",
      "Fill in section headers only",
    ],
  },
  { id: 2, name: "Review pull requests", energy: "steady", minutes: 30 },
  { id: 3, name: "Book dentist appointment", energy: "low", minutes: 5 },
  { id: 4, name: "Plan the team offsite agenda", energy: "high", minutes: 45, steps: ["Block the 3 session slots", "Ask Ana for must-haves"] },
  { id: 5, name: "Clear email inbox to zero-ish", energy: "low", minutes: 15 },
  { id: 6, name: "Groceries run", energy: "steady", minutes: 40 },
]

const filters = [
  { label: "All", match: () => true },
  { label: "High energy", match: (t: Task) => t.energy === "high" },
  { label: "Steady", match: (t: Task) => t.energy === "steady" },
  { label: "Low energy", match: (t: Task) => t.energy === "low" },
  { label: "Under 15m", match: (t: Task) => t.minutes <= 15 },
]

function timeAgo(d: Date) {
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (mins < 1)
    return "just now";
  if (mins < 60) 
    return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) 
    return `${hours}h ago`;

  const days = Math.floor(hours / 24)
  if (days === 1) 
    return "yesterday"

  return `${days}d ago`
}

export function TasksPage() {
  const [tasks, setTasks] = useState(seedTasks)
  const [filter, setFilter] = useState("All")
  const [openTask, setOpenTask] = useState<number | null>(1)

  const toggleDone = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const notes = seedNotes
  const visible = tasks.filter(filters.find((f) => f.label === filter)!.match)
  const openCount = tasks.filter((t) => !t.done).length

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Notes Section (Left) */}
      <section className="flex min-h-0 flex-col border-b border-border lg:w-[42%] lg:border-r lg:border-b-0">
        <div className="flex-none px-8 pt-9 pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">Notes</h1>
            <span className="text-[11.5px] text-ink-3">{notes.length} notes</span>
          </div>

          <div className="mt-4 rounded-2xl border-2 border-primary bg-card p-4 shadow-[var(--shadow)]">
            <Textarea
              rows={3}
              placeholder="Enter any thoughts that come to mind here."
              className="resize-none border-none p-0 text-[14.5px] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <div className="mt-2 flex items-center justify-between">
              <Button size="sm">Add Note</Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-1 pb-10">
          <div className="flex flex-col gap-1.5">
            {notes.map((n) => (
              <div
                key={n.id}
                className="group relative rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-ink-3/50"
              >
                <p className="pr-14 text-[13px] leading-snug">{n.body}</p>
                <span className="mt-1 block font-mono text-[10px] text-ink-3">
                  {timeAgo(n.createdAt)}
                </span>

                <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    title="Make a task"
                    className="grid size-6 place-items-center rounded-md text-ink-3 hover:bg-accent-soft hover:text-primary"
                  >
                    <ListPlus className="size-3.5" strokeWidth={1.8} />
                  </button>
                  <button
                    title="Delete note"
                    className="grid size-6 place-items-center rounded-md text-ink-3 hover:bg-linesoft hover:text-destructive"
                  >
                    <X className="size-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tasks section (right) */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex-none px-8 pt-9 pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-heading text-[22px] font-semibold tracking-tight">Tasks</h1>
            <span className="text-[11.5px] text-ink-3">{openCount} open</span>
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
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow)]">
            {visible.map((t, i) => {
              const open = openTask === t.id
              return (
                <div key={t.id} className={i < visible.length - 1 ? "border-b border-linesoft" : ""}>
                  <div className="flex items-center gap-3 px-4.5 py-3.5">
                    <button
                      onClick={() => toggleDone(t.id)}
                      className={cn(
                        "size-5 flex-none cursor-pointer rounded-md border-[1.5px] transition-colors",
                        t.done ? "border-primary bg-primary" : "border-line hover:border-primary"
                      )}
                    />
                    <button
                      onClick={() => setOpenTask(open ? null : t.id)}
                      className={cn(
                        "flex-1 cursor-pointer text-left text-sm font-medium",
                        t.done && "text-ink-3 line-through"
                      )}
                    >
                      {t.name}
                    </button>
                    <EnergyBadge level={t.energy} />
                    <span className="w-9 text-right font-mono text-[11.5px] text-ink-3">
                      {t.minutes}m
                    </span>
                    {t.steps ? (
                      open ? (
                        <ChevronUp className="size-3.5 text-ink-3" strokeWidth={1.8} />
                      ) : (
                        <ChevronDown className="size-3.5 text-ink-3" strokeWidth={1.8} />
                      )
                    ) : (
                      <span className="size-3.5" />
                    )}
                  </div>

                  {open && t.steps && (
                    <div className="flex flex-col gap-2 py-0.5 pr-4.5 pb-3.5 pl-12.5">
                      <div className="text-[11px] font-semibold tracking-[.06em] text-ink-3 uppercase">
                        Micro-steps — just do the first one
                      </div>
                      {t.steps.map((s) => (
                        <div key={s} className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                          <span className="size-3.5 flex-none rounded-[5px] border-[1.5px] border-line" />
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {visible.length === 0 && (
              <p className="px-4.5 py-10 text-center text-[13px] text-ink-3">
                Nothing matches that filter.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
