import { GripVertical } from "lucide-react"

const HOUR_PX = 56
const START_HOUR = 8
const END_HOUR = 18

const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
  const h = START_HOUR + i
  return { label: `${h > 12 ? h - 12 : h} ${h >= 12 ? "PM" : "AM"}`, top: i * HOUR_PX }
})

type BlockColor = "accent" | "blue" | "green" | "violet"

const colorClasses: Record<BlockColor, { bg: string; bar: string; fg: string; dot: string }> = {
  accent: { bg: "bg-accent-soft", bar: "border-primary", fg: "text-primary", dot: "bg-primary" },
  blue: { bg: "bg-blue-soft", bar: "border-blue", fg: "text-blue", dot: "bg-blue" },
  green: { bg: "bg-green-soft", bar: "border-green", fg: "text-green", dot: "bg-green" },
  violet: { bg: "bg-violet-soft", bar: "border-violet", fg: "text-violet", dot: "bg-violet" },
}

function block(from: number, len: number, label: string, time: string, color: BlockColor) {
  return {
    top: (from - START_HOUR) * HOUR_PX + 1,
    height: len * HOUR_PX - 4,
    label,
    time,
    color,
  }
}

const blocks = [
  block(8.5, 1, "Morning setup + coffee", "8:30–9:30", "green"),
  block(9.5, 1.5, "Deep work — Q3 brief", "9:30–11:00", "accent"),
  block(11, 0.33, "Break — walk", "11:00", "green"),
  block(11.33, 1.17, "Admin sweep — email + invoice", "11:20–12:30", "blue"),
  block(12.5, 1, "Lunch, away from desk", "12:30–1:30", "green"),
  block(13.5, 1.5, "Deep work — PR reviews", "1:30–3:00", "accent"),
  block(15, 0.5, "Break", "3:00–3:30", "green"),
  block(15.5, 1, "Errands — dentist + groceries", "3:30–4:30", "violet"),
  block(16.5, 1, "Wrap up + daily log", "4:30–5:30", "blue"),
]

const unscheduled = [
  { name: "Book dentist", est: "5m" },
  { name: "Review pull requests", est: "30m" },
  { name: "Groceries run", est: "40m" },
]

const legend: { label: string; color: BlockColor }[] = [
  { label: "Deep", color: "accent" },
  { label: "Admin", color: "blue" },
  { label: "Break", color: "green" },
  { label: "Errands", color: "violet" },
]

export function TimeBlockerPage() {
  return (
    <div className="mx-auto max-w-[960px] px-11 pt-10 pb-16">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-[28px] font-semibold tracking-tight">Time Blocker</h1>
          <div className="mt-1 text-[13px] text-muted-foreground">
            Give every hour one job. Blocks, not lists.
          </div>
        </div>
        <div className="flex gap-2">
          {legend.map((l) => (
            <span
              key={l.label}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${colorClasses[l.color].bg} ${colorClasses[l.color].fg}`}
            >
              <span className={`size-2 rounded-sm ${colorClasses[l.color].dot}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_260px] items-start gap-5">
        <div className="rounded-xl border border-border bg-card py-5 pr-5 pl-3.5 shadow-[var(--shadow)]">
          <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_PX }}>
            {hours.map((h) => (
              <div
                key={h.label}
                className="absolute right-0 left-0 flex items-start gap-2.5"
                style={{ top: h.top }}
              >
                <span className="w-9.5 -translate-y-1.5 text-right font-mono text-[10.5px] text-ink-3">
                  {h.label}
                </span>
                <div className="flex-1 border-t border-linesoft" />
              </div>
            ))}
            {blocks.map((b) => (
              <div
                key={b.label}
                className={`absolute right-1 left-14 cursor-pointer overflow-hidden rounded-[7px] border-l-[3px] px-3 py-2 box-border hover:brightness-[.97] ${colorClasses[b.color].bg} ${colorClasses[b.color].bar}`}
                style={{ top: b.top, height: b.height }}
              >
                <div className="flex justify-between gap-2">
                  <span className={`text-[12.5px] font-semibold ${colorClasses[b.color].fg}`}>{b.label}</span>
                  <span className={`font-mono text-[10.5px] opacity-70 ${colorClasses[b.color].fg}`}>{b.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4.5 shadow-[var(--shadow)]">
            <div className="text-[12.5px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
              Unscheduled
            </div>
            <div className="mt-0.5 text-[11.5px] text-ink-3">Drag onto the day</div>
            <div className="mt-3 flex flex-col gap-2">
              {unscheduled.map((t) => (
                <div
                  key={t.name}
                  className="flex cursor-grab items-center gap-2 rounded-lg border border-dashed border-line px-2.5 py-2 text-[13px] hover:border-ink-3"
                >
                  <GripVertical className="size-3.5 text-ink-3" />
                  {t.name}
                  <span className="ml-auto font-mono text-[10.5px] text-ink-3">{t.est}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-blue-soft px-4.5 py-4">
            <div className="text-[12.5px] font-semibold text-blue">Rule of thumb</div>
            <div className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              Plan at 70% capacity. The empty space is the plan working, not failing.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
