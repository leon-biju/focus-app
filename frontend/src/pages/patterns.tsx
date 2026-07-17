let seed = 7
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

const heatCells = Array.from({ length: 84 }, (_, i) => {
  const wk = i % 7 >= 5 ? rnd() * 0.5 : rnd()
  return wk < 0.2
    ? "bg-linesoft"
    : wk < 0.5
      ? "bg-primary/28"
      : wk < 0.78
        ? "bg-primary/58"
        : "bg-primary"
})

const estRows = [
  { name: "Deep work", est: "52%", act: "84%", note: "+61%" },
  { name: "Admin", est: "38%", act: "42%", note: "+9%" },
  { name: "Errands", est: "30%", act: "26%", note: "-13%" },
  { name: "Writing", est: "45%", act: "70%", note: "+55%" },
]

const friction = [
  { name: "Slack pings", w: "92%", n: 14 },
  { name: "Couldn't start", w: "64%", n: 10 },
  { name: "Meeting overran", w: "50%", n: 8 },
  { name: "Low sleep", w: "36%", n: 6 },
  { name: "Doomscrolling", w: "22%", n: 3 },
]

const energyRows = [
  { label: "High energy", color: "text-amber", w: "88%", note: "5.1/day" },
  { label: "Steady", color: "text-green", w: "64%", note: "3.7/day" },
  { label: "Low energy", color: "text-blue", w: "31%", note: "1.8/day" },
]

export function PatternsPage() {
  return (
    <div className="mx-auto max-w-[960px] px-11 pt-10 pb-16">
      <h1 className="font-heading text-[28px] font-semibold tracking-tight">Patterns</h1>
      <div className="mt-1.5 text-[13px] text-muted-foreground">
        Data, not judgment. Here's what your last 12 weeks actually look like.
      </div>

      <div className="mt-6 grid grid-cols-2 items-start gap-5">
        <div className="col-span-2 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow)]">
          <div className="flex items-baseline justify-between">
            <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
              Completion heat map
            </div>
            <div className="text-xs text-ink-3">Tasks closed per day</div>
          </div>
          <div
            className="mt-4 grid gap-0.75"
            style={{ gridTemplateRows: "repeat(7, 14px)", gridAutoFlow: "column", justifyContent: "start" }}
          >
            {heatCells.map((c, i) => (
              <div key={i} className={`size-3.5 rounded-[3px] ${c}`} />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-3">
            Less
            <span className="size-2.75 rounded-[3px] bg-linesoft" />
            <span className="size-2.75 rounded-[3px] bg-primary/28" />
            <span className="size-2.75 rounded-[3px] bg-primary/58" />
            <span className="size-2.75 rounded-[3px] bg-primary" />
            More
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow)]">
          <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
            Estimate vs reality
          </div>
          <div className="mt-0.5 text-xs text-ink-3">You underestimate deep work by ~60%</div>
          <div className="mt-4.5 flex flex-col gap-3.5">
            {estRows.map((r) => (
              <div key={r.name}>
                <div className="mb-1.25 flex justify-between text-xs">
                  <span className="font-medium">{r.name}</span>
                  <span className="font-mono text-[11px] text-ink-3">{r.note}</span>
                </div>
                <div className="flex flex-col gap-0.75">
                  <div className="h-2 rounded-sm bg-linesoft" style={{ width: r.est }} />
                  <div className="h-2 rounded-sm bg-primary" style={{ width: r.act }} />
                </div>
              </div>
            ))}
            <div className="flex gap-3.5 text-[11px] text-ink-3">
              <span className="flex items-center gap-1.25">
                <span className="h-2 w-2.5 rounded-sm bg-linesoft" />
                Estimated
              </span>
              <span className="flex items-center gap-1.25">
                <span className="h-2 w-2.5 rounded-sm bg-primary" />
                Actual
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow)]">
            <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
              Friction, ranked
            </div>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {friction.map((f) => (
                <div key={f.name} className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="w-27.5 flex-none font-medium">{f.name}</span>
                  <div className="h-2.25 flex-1 overflow-hidden rounded-full bg-linesoft">
                    <div className="h-full rounded-full bg-amber" style={{ width: f.w }} />
                  </div>
                  <span className="w-6.5 text-right font-mono text-[11px] text-ink-3">{f.n}×</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow)]">
            <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
              Energy vs output
            </div>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {energyRows.map((r) => (
                <div key={r.label} className="flex items-center gap-2.5 text-[12.5px]">
                  <span className={`w-27.5 flex-none font-medium ${r.color}`}>{r.label}</span>
                  <div className="h-2.25 flex-1 overflow-hidden rounded-full bg-linesoft">
                    <div className="h-full bg-green" style={{ width: r.w }} />
                  </div>
                  <span className="font-mono text-[11px] text-ink-3">{r.note}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Matching task tags to your energy nearly triples your throughput.
            </div>
          </div>
        </div>

        <div className="col-span-2 grid grid-cols-2 gap-5">
          <div className="rounded-xl border border-border bg-green-soft px-5 py-4.5">
            <div className="text-xs font-semibold tracking-[.06em] text-green uppercase">Best day</div>
            <div className="mt-1.5 font-heading text-xl font-semibold">Tuesday</div>
            <div className="mt-0.75 text-[12.5px] text-muted-foreground">
              Avg 6.2 tasks closed — protect it from meetings.
            </div>
          </div>
          <div className="rounded-xl border border-border bg-blue-soft px-5 py-4.5">
            <div className="text-xs font-semibold tracking-[.06em] text-blue uppercase">Best time</div>
            <div className="mt-1.5 font-heading text-xl font-semibold">9:00 – 11:30</div>
            <div className="mt-0.75 text-[12.5px] text-muted-foreground">
              72% of deep work finished here. Schedule hard things before noon.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
