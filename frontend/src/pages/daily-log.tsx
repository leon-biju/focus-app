import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const moodColors = ["bg-linesoft", "bg-amber-soft", "bg-amber", "bg-green-soft", "bg-green"]
const daySeq = [
  4, 3, 3, 1, 4, 0, 3, 4, 4, 2, 3, 3, 0, 1, 3, 4, 4, 3, 2, 3, 0, 4, 3, 1, 3, 4, 4, 3, 3, 4,
]
const calDays = daySeq.map((v, i) => ({
  day: i + 1,
  color: moodColors[v],
  isToday: i === daySeq.length - 1,
}))

const mouths = [
  "M8.5 16c1-1.6 6-1.6 7 0",
  "M9 15.5c1.2-.9 4.8-.9 6 0",
  "M9 15h6",
  "M9 14.5c1.2 1 4.8 1 6 0",
  "M8.5 14c1 1.8 6 1.8 7 0",
]
const currentMood = 3

const wins = [
  "Sent the invoice I'd been avoiding for a week",
  "Actually took the walk break",
]

const frictionTags = [
  { label: "Slack pings", active: true },
  { label: "Couldn't start", active: false },
  { label: "Meeting overran", active: true },
  { label: "Low sleep", active: false },
  { label: "Doomscrolling", active: false },
]

export function DailyLogPage() {
  return (
    <div className="mx-auto max-w-[760px] px-11 pt-10 pb-16">
      <div className="flex items-baseline justify-between">
        <h1 className="font-heading text-[28px] font-semibold tracking-tight">Daily Log</h1>
        <span className="text-[12.5px] text-ink-3">60 seconds. Honest, not pretty.</span>
      </div>

      <div className="mt-5.5 flex gap-1.25">
        {calDays.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1.25">
            <div
              className={`aspect-square w-full rounded-md box-border ${d.color} ${d.isToday ? "border-2 border-primary" : "border border-linesoft"}`}
            />
            <span className="font-mono text-[9px] text-ink-3">{d.day}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-6.5 rounded-2xl border border-border bg-card p-6.5 shadow-[var(--shadow)]">
        <div>
          <div className="text-[13px] font-semibold">How did today feel?</div>
          <div className="mt-3 flex gap-2.5">
            {mouths.map((mouth, i) => (
              <button
                key={i}
                className={`grid size-13 place-items-center rounded-xl hover:border-ink-3 ${
                  i === currentMood
                    ? "border-2 border-primary bg-accent-soft"
                    : "border border-line bg-card"
                }`}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round"
                  stroke={i === currentMood ? "var(--primary)" : "var(--ink-3)"}>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8.5 10h.01M15.5 10h.01" />
                  <path d={mouth} />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[13px] font-semibold">Wins — even tiny ones count</div>
          <div className="mt-3 flex flex-col gap-2">
            {wins.map((w) => (
              <Input key={w} defaultValue={w} className="text-[13.5px]" />
            ))}
            <Input placeholder="One more?" className="border-dashed text-[13.5px]" />
          </div>
        </div>

        <div>
          <div className="text-[13px] font-semibold">What got in the way?</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {frictionTags.map((t) => (
              <span
                key={t.label}
                className={
                  t.active
                    ? "cursor-pointer rounded-full bg-amber-soft px-3.5 py-1.75 text-xs font-semibold text-amber"
                    : "cursor-pointer rounded-full border border-line px-3.5 py-1.75 text-xs font-semibold text-muted-foreground hover:border-ink-3"
                }
              >
                {t.label}
              </span>
            ))}
            <span className="cursor-pointer rounded-full border border-dashed border-line px-3.5 py-1.75 text-xs font-semibold text-ink-3">
              + add
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <div className="text-[13px] font-semibold">Tomorrow's 3</div>
            <span className="text-[11.5px] text-ink-3">Pick from your list — 2 of 3 chosen</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-primary bg-accent-soft px-3.5 py-2.75 text-[13.5px]">
              <span className="font-mono text-[11px] font-semibold text-primary">1</span>
              Finish Q3 brief — get feedback from Ana
            </div>
            <div className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-primary bg-accent-soft px-3.5 py-2.75 text-[13.5px]">
              <span className="font-mono text-[11px] font-semibold text-primary">2</span>
              Review pull requests
            </div>
            <div className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-line px-3.5 py-2.75 text-[13.5px] text-ink-3 hover:border-ink-3">
              <span className="font-mono text-[11px] font-semibold">3</span>
              Choose one more…
            </div>
          </div>
        </div>

        <Button className="bg-foreground text-background hover:bg-foreground/90">
          Close the day ✓
        </Button>
      </div>
    </div>
  )
}
