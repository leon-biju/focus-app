import { Plus } from "lucide-react"
import { toast } from "sonner"
import { EnergyBadge } from "@/components/energy-badge"
import { ProgressRing } from "@/components/progress-ring"
import { Button } from "@/components/ui/button"
import { useNoteComposer } from "@/hooks/use-notes"

const todaysThree = [
  { name: "Send the invoice to Meridian", done: true, energy: "low" as const, est: "~10m" },
  { name: "Draft Q3 project brief", done: false, energy: "high" as const, est: "~50m" },
  { name: "Book dentist appointment", done: false, energy: "steady" as const, est: "~5m" },
]

const upNext = [
  { time: "11:00", label: "Break — walk outside", color: "bg-green" },
  { time: "11:20", label: "Admin sweep — email + invoice", color: "bg-blue" },
]

export function DashboardPage() {
  // Nothing on this page lists notes, so confirm the capture landed somewhere
  const composer = useNoteComposer(() => toast.success("Saved to your notes"))

  return (
    <div className="mx-auto max-w-[960px] px-11 pt-10 pb-16">
      <div className="flex items-end justify-between gap-5">
        <div>
          <div className="text-[12.5px] font-semibold tracking-[.08em] text-muted-foreground uppercase">
            Friday, July 17
          </div>
          <h1 className="mt-1.5 font-heading text-[34px] font-semibold tracking-tight">
            One thing at a time.
          </h1>
        </div>
        <ProgressRing size={92} stroke={8} fraction={4 / 7}>
          <div>
            <div className="font-mono text-[19px] font-semibold">4/7</div>
            <div className="text-[10px] text-muted-foreground">done</div>
          </div>
        </ProgressRing>
      </div>

      <div className="mt-6.5 flex items-center gap-2.5 rounded-xl border border-border bg-card py-1.5 pr-1.5 pl-4.5 shadow-[var(--shadow)]">
        <Plus className="size-4 flex-none text-ink-3" strokeWidth={1.8} />
        <input
          value={composer.draft}
          onChange={(e) => composer.setDraft(e.target.value)}
          onKeyDown={composer.onKeyDown}
          className="flex-1 border-none bg-transparent py-2.5 text-sm outline-none"
          placeholder="Add anything…"
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!composer.canSubmit}
          onClick={composer.submit}
          className="hover:bg-accent-soft hover:text-primary"
        >
          {composer.isPending ? "Capturing…" : "Capture ⏎"}
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-[1.5fr_1fr] items-start gap-5">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow)]">
          <div className="flex items-baseline justify-between">
            <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
              Today's 3
            </div>
            <div className="text-xs text-ink-3">That's all you owe today</div>
          </div>
          <div className="mt-3 flex flex-col">
            {todaysThree.map((t, i) => (
              <div
                key={t.name}
                className={
                  "flex items-center gap-3 py-3.5" +
                  (i < todaysThree.length - 1 ? " border-b border-linesoft" : "")
                }
              >
                <div
                  className={
                    t.done
                      ? "grid size-5 flex-none place-items-center rounded-md bg-green"
                      : "size-5 flex-none rounded-md border-[1.5px] border-line"
                  }
                >
                  {t.done && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2">
                      <path d="M2 6.5 5 9l5-6" />
                    </svg>
                  )}
                </div>
                <div
                  className={
                    "flex-1 text-[14.5px]" +
                    (t.done ? " text-ink-3 line-through" : " font-medium")
                  }
                >
                  {t.name}
                </div>
                <EnergyBadge level={t.energy} />
                <span className="font-mono text-[11.5px] text-ink-3">{t.est}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-accent-soft p-5 shadow-[var(--shadow)]">
            <div className="flex items-baseline justify-between">
              <div className="text-[13px] font-semibold tracking-[.06em] text-primary uppercase">Now</div>
              <div className="font-mono text-xs text-muted-foreground">9:30 – 11:00</div>
            </div>
            <div className="mt-2 font-heading text-[21px] font-semibold tracking-tight">Deep work block</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">Draft Q3 project brief</div>
            <Button className="mt-4 w-full">Enter Focus Mode →</Button>
          </div>

          <div className="rounded-xl border border-border bg-card px-5 py-4.5 shadow-[var(--shadow)]">
            <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
              Up next
            </div>
            <div className="mt-2.5 flex flex-col gap-2.5 text-[13px]">
              {upNext.map((item) => (
                <div key={item.time} className="flex items-center gap-2.5">
                  <span className={`size-2 flex-none rounded-sm ${item.color}`} />
                  <span className="font-mono text-[11.5px] text-ink-3">{item.time}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
