import { Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { EnergyBadge, type EnergyLevel } from "@/components/energy-badge"

const filters = ["All", "High energy", "Steady", "Low energy", "Under 15m"]

const tasks: {
  name: string
  energy: EnergyLevel
  est: string
  open?: boolean
  steps?: string[]
}[] = [
  {
    name: "Draft Q3 project brief",
    energy: "high",
    est: "50m",
    open: true,
    steps: [
      "Open the doc, write one ugly sentence",
      "List the 3 decisions it must answer",
      "Fill in section headers only",
    ],
  },
  { name: "Review pull requests", energy: "steady", est: "30m" },
  { name: "Book dentist appointment", energy: "low", est: "5m" },
  { name: "Plan the team offsite agenda", energy: "high", est: "45m" },
  { name: "Clear email inbox to zero-ish", energy: "low", est: "15m" },
  { name: "Groceries run", energy: "steady", est: "40m" },
]

export function NotesPage() {
  return (
    <div className="mx-auto max-w-[820px] px-11 pt-10 pb-16">
      <h1 className="font-heading text-[28px] font-semibold tracking-tight">Notes</h1>

      <div className="mt-5 rounded-2xl border-2 border-primary bg-card p-5 shadow-[var(--shadow)]">
        <Textarea
          rows={3}
          placeholder="Brain dump. Type everything in your head — sorting comes later."
          className="resize-none border-none p-0 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11.5px] text-ink-3">
            Everything lands in your inbox. Nothing gets lost.
          </span>
          <Button size="sm">Dump it</Button>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        {filters.map((f, i) => (
          <span
            key={f}
            className={
              i === 0
                ? "cursor-pointer rounded-full bg-foreground px-3.5 py-1.5 text-xs font-semibold text-background"
                : "cursor-pointer rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-ink-3"
            }
          >
            {f}
          </span>
        ))}
        <button className="ml-auto flex items-center gap-1.5 rounded-full bg-violet-soft px-3.5 py-2 text-[12.5px] font-semibold text-violet hover:brightness-[.96]">
          <Sparkles className="size-3.5" strokeWidth={1.8} />
          Pick for me
        </button>
      </div>

      <div className="mt-3.5 flex items-center gap-2.5 rounded-lg border border-violet bg-violet-soft px-4 py-3">
        <span className="text-[13px]">
          Do this one: <strong>Review pull requests</strong>. Don't overthink it.
        </span>
        <button className="ml-auto text-xs font-semibold text-violet">Re-roll</button>
      </div>

      <div className="mt-3.5 rounded-xl border border-border bg-card shadow-[var(--shadow)]">
        {tasks.map((t, i) => (
          <div key={t.name} className={i < tasks.length - 1 ? "border-b border-linesoft" : ""}>
            <div className="flex items-center gap-3 px-4.5 py-3.5">
              <div className="size-5 flex-none cursor-pointer rounded-md border-[1.5px] border-line hover:border-primary" />
              <div className="flex-1 text-sm font-medium">{t.name}</div>
              <EnergyBadge level={t.energy} />
              <span className="w-9 text-right font-mono text-[11.5px] text-ink-3">{t.est}</span>
              {t.open ? (
                <ChevronUp className="size-3.5 text-ink-3" strokeWidth={1.8} />
              ) : (
                <ChevronDown className="size-3.5 text-ink-3" strokeWidth={1.8} />
              )}
            </div>
            {t.open && t.steps && (
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
        ))}
      </div>
    </div>
  )
}
