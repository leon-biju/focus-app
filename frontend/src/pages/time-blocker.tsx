import { useEffect, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { TimeBlockDialog, type TimeBlockDraft } from "@/components/time-block-dialog"
import { DayNav } from "@/components/time-blocker/day-nav"
import { Button } from "@/components/ui/button"
import {
  BUFFER_MINUTES,
  DAY_END,
  DAY_START,
  buildAgenda,
  dayCursor,
  fitToGap,
  formatDuration,
  formatDurationShort,
  formatTime,
  minutesOfDay,
  type BlockState,
  type TimeBlock,
} from "@/lib/time-blocks"
import { cn } from "@/lib/utils"

const clock = (hours: number, minutes = 0) => hours * 60 + minutes

// TODO(api): useTimeBlocks(date) — GET /time-blocks?date=YYYY-MM-DD
const seedBlocks: TimeBlock[] = [
  {
    id: "seed-1",
    title: "Morning setup & inbox triage",
    details: "Clear overnight email, flag what actually needs a reply",
    start: clock(8, 30),
    end: clock(9, 15),
  },
  {
    id: "seed-2",
    title: "Deep work — Q3 roadmap draft",
    details: "First full pass. No meetings, phone in the drawer.",
    start: clock(9, 30),
    end: clock(11),
  },
  { id: "seed-3", title: "Break — walk", details: null, start: clock(11, 15), end: clock(11, 45) },
  {
    id: "seed-4",
    title: "Lunch, away from desk",
    details: null,
    start: clock(12, 30),
    end: clock(13, 15),
  },
  {
    id: "seed-5",
    title: "Deep work — PR reviews",
    details: "Two still pending on the sync service",
    start: clock(14),
    end: clock(15, 30),
  },
  {
    id: "seed-6",
    title: "1:1 with Maya",
    details: "Career check-in — she's bringing the hiring plan",
    start: clock(16),
    end: clock(16, 45),
  },
  { id: "seed-7", title: "Gym", details: null, start: clock(19), end: clock(20) },
  {
    id: "seed-8",
    title: "Wrap up & daily log",
    details: "Tomorrow's first block decided before bed",
    start: clock(20, 30),
    end: clock(21),
  },
]

// The line has to move on its own, or it goes quietly stale on a page left open
function useNowMinutes() {
  const [now, setNow] = useState(() => minutesOfDay(new Date()))
  useEffect(() => {
    const timer = setInterval(() => setNow(minutesOfDay(new Date())), 30_000)
    return () => clearInterval(timer)
  }, [])
  return now
}

const stateClasses: Record<BlockState, string> = {
  past: "border-border opacity-55",
  now: "border-primary ring-3 ring-accent-soft",
  upcoming: "border-border",
}

function BlockCard({
  block,
  state,
  nowPct,
  onEdit,
}: {
  block: TimeBlock
  state: BlockState
  nowPct: number
  onEdit: () => void
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-4 rounded-xl border bg-card px-4 py-3.5 shadow-[var(--shadow)]",
        stateClasses[state]
      )}
    >
      {/* Sits where we are inside this block, so the line crosses it in proportion */}
      {state === "now" && (
        <div
          className="pointer-events-none absolute -inset-x-2 z-10 flex -translate-y-1/2 items-center"
          style={{ top: `${nowPct}%` }}
        >
          <span className="size-2 flex-none rounded-full bg-primary" />
          <span className="h-0.5 flex-1 bg-primary" />
          <span className="size-2 flex-none rounded-full bg-primary" />
        </div>
      )}

      <div className="flex w-[68px] flex-none flex-col justify-between py-0.5">
        <span className="font-mono text-[13px] whitespace-nowrap text-ink">
          {formatTime(block.start)}
        </span>
        <span className="font-mono text-[12px] whitespace-nowrap text-ink-3">
          {formatTime(block.end)}
        </span>
      </div>

      <div className="w-px flex-none bg-line" />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-ink">{block.title}</span>
          {state === "now" && (
            <span className="flex-none rounded-full bg-primary px-1.5 py-[2px] text-[10px] font-semibold tracking-[.06em] text-primary-foreground uppercase">
              Now
            </span>
          )}
        </div>
        {block.details && (
          <span className="text-[13px] leading-snug text-muted-foreground">{block.details}</span>
        )}
      </div>

      <div className="flex flex-none flex-col items-end justify-between gap-1.5 py-0.5">
        {/* Quiet until you're on the card, but never hidden from the keyboard */}
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Edit ${block.title}`}
          onClick={onEdit}
          className="text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-ink"
        >
          <Pencil />
        </Button>
        <span className="font-mono text-[11px] whitespace-nowrap text-ink-3">
          {formatDuration(block.end - block.start)}
        </span>
      </div>
    </div>
  )
}

// Quiet at rest — it's an invitation, not a row in its own right
function GapCard({ start, end, onClick }: { start: number; end: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Add a block between ${formatTime(start)} and ${formatTime(end)}`}
      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-linesoft px-3 py-2 text-ink-3 transition-colors hover:border-line hover:bg-linesoft hover:text-ink-2"
    >
      <Plus className="size-3" strokeWidth={2} />
      <span className="font-mono text-[11px]">{formatDurationShort(end - start)}</span>
      <span className="text-[11px]">available</span>
    </button>
  )
}

// Time already spent can't be booked, so it's just a measurement now
function PastGap({ minutes }: { minutes: number }) {
  return (
    <div className="py-0.5 text-center font-mono text-[11px] text-ink-3">
      {formatDurationShort(minutes)}
    </div>
  )
}

// The current time when no block is in progress to carry the line itself
function NowLine({ minutes }: { minutes: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-[12px] font-semibold text-primary">
        {formatTime(minutes)}
      </span>
      <span className="size-2 flex-none rounded-full bg-primary" />
      <div className="h-0.5 flex-1 rounded-full bg-primary" />
    </div>
  )
}

function DayEdge({
  label,
  caption,
  className,
}: {
  label: string
  caption: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="font-mono text-[12px] text-ink-3">{label}</span>
      <div className="h-px flex-1 bg-line" />
      <span className="text-[12px] text-ink-3">{caption}</span>
    </div>
  )
}

type Editing = { block?: TimeBlock; range: { start: number; end: number } }

export function TimeBlockerPage() {
  const [date, setDate] = useState(() => new Date())
  const [blocks, setBlocks] = useState<TimeBlock[]>(seedBlocks)
  // undefined = closed, a range alone = creating, a block = editing that one
  const [editing, setEditing] = useState<Editing | undefined>(undefined)
  const nowMinutes = useNowMinutes()

  const { items, freeMinutes } = buildAgenda(blocks, dayCursor(date, nowMinutes))

  // Where "New block" starts you off. Clicking a gap means "fill this gap" and
  // takes the whole fitted span; a generic add just wants somewhere free to
  // land, so it takes an hour off the front of it.
  const openingRange = () => {
    const gaps = items.filter((item) => item.kind === "gap")
    const target = gaps.find((gap) => !gap.isPast) ?? gaps[0]
    if (!target) return { start: DAY_START, end: DAY_START + 60 }
    const fitted = fitToGap(target.start, target.end)
    return { start: fitted.start, end: Math.min(fitted.end, fitted.start + 60) }
  }

  const save = (draft: TimeBlockDraft) => {
    const target = editing?.block
    // TODO(api): useCreateTimeBlock / useUpdateTimeBlock
    setBlocks((prev) =>
      target
        ? prev.map((b) => (b.id === target.id ? { ...b, ...draft } : b))
        : [...prev, { id: crypto.randomUUID(), ...draft }]
    )
  }

  // TODO(api): useDeleteTimeBlock
  const remove = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id))

  const summary = `${blocks.length} ${blocks.length === 1 ? "block" : "blocks"} · ${formatDuration(freeMinutes)} free`

  return (
    <div className="mx-auto max-w-[680px] px-8 pt-9 pb-16">
      <DayNav
        date={date}
        summary={summary}
        onChange={setDate}
        onAddBlock={() => setEditing({ range: openingRange() })}
      />

      <DayEdge label={formatTime(DAY_START)} caption="day starts" className="mt-6 mb-3.5" />

      {blocks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-4.5 py-10 shadow-[var(--shadow)]">
          <p className="text-[13px] text-ink-3">Nothing blocked out for this day.</p>
          <Button variant="outline" size="sm" onClick={() => setEditing({ range: openingRange() })}>
            <Plus />
            Add the first block
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => {
            if (item.kind === "gap") {
              if (item.isPast) {
                return <PastGap key={item.key} minutes={item.end - item.start} />
              }
              return (
                <GapCard
                  key={item.key}
                  start={item.start}
                  end={item.end}
                  // Fitted to the space, so the dialog opens with times that already work
                  onClick={() => setEditing({ range: fitToGap(item.start, item.end) })}
                />
              )
            }
            if (item.kind === "now-line") return <NowLine key={item.key} minutes={item.at} />
            return (
              <BlockCard
                key={item.key}
                block={item.block}
                state={item.state}
                nowPct={item.nowPct}
                onEdit={() =>
                  setEditing({
                    block: item.block,
                    range: { start: item.block.start, end: item.block.end },
                  })
                }
              />
            )
          })}
        </div>
      )}

      <DayEdge label={formatTime(DAY_END)} caption="day ends" className="mt-3.5" />

      {/* Nothing left to click on a day that's already been */}
      {items.some((item) => item.kind === "gap" && !item.isPast) && (
        <p className="mt-4.5 text-center text-[12px] text-ink-3">
          Gaps are fitted with {BUFFER_MINUTES} min buffers on each side.
        </p>
      )}

      <TimeBlockDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        block={editing?.block}
        range={editing?.range ?? { start: DAY_START, end: DAY_START + 60 }}
        blocks={blocks}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}
