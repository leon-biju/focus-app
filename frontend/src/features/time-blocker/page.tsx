import { useEffect, useMemo, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { TimeBlockDialog } from "@/features/time-blocker/time-block-dialog"
import { useCategories } from "@/shared/use-categories"
import { useMe } from "@/features/settings/use-settings"
import { useIncompleteTasks } from "@/features/tasks/use-tasks"
import {
  useCreateTimeBlock,
  useDayBounds,
  useDeleteTimeBlock,
  useTimeBlocks,
  useUpdateTimeBlock,
} from "@/features/time-blocker/use-time-blocks"
import { DayNav } from "@/features/time-blocker/day-nav"
import { Button } from "@/components/ui/button"
import type { Category } from "@/shared/categories"
import {
  BUFFER_MINUTES,
  buildAgenda,
  dayCursor,
  fitToGap,
  formatDuration,
  formatDurationShort,
  formatTime,
  minutesOfDay,
  type BlockState,
  type TimeBlock,
  type TimeBlockDraft,
} from "@/features/time-blocker/api"
import { cn } from "@/lib/utils"

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
  use24h,
  onEdit,
  category,
  taskTitle,
}: {
  block: TimeBlock
  state: BlockState
  nowPct: number
  use24h: boolean
  onEdit: () => void
  category?: Category
  taskTitle?: string
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-4 overflow-hidden rounded-xl border bg-card px-4 py-3.5 shadow-[var(--shadow)]",
        stateClasses[state]
      )}
    >
      {category && (
        <div
          className="absolute inset-y-0 left-0 w-2.5 rounded-l-xl"
          style={{ backgroundColor: category.color }}
        />
      )}

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
          {formatTime(block.start, use24h)}
        </span>
        <span className="font-mono text-[12px] whitespace-nowrap text-ink-3">
          {formatTime(block.end, use24h)}
        </span>
      </div>

      <div className="w-px flex-none bg-line" />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-ink">{block.title}</span>
          {state === "now" && (
            <span className="flex-none rounded-full bg-primary px-1.5 py-[2px] text-[10px] font-semibold tracking-[.06em] text-primary-foreground uppercase">
              Now
            </span>
          )}
        </div>
        {taskTitle && (
          <span className="min-w-0 truncate rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-2 italic w-fit">
            {taskTitle}
          </span>
        )}
        {block.details && (
          <span className="text-[13px] leading-snug text-muted-foreground">{block.details}</span>
        )}
      </div>

      <div className="flex flex-none flex-col items-end justify-between gap-1.5 py-0.5">
        <div className="flex items-center gap-1.5">
          {category && (
            <span
              className="rounded-full px-2 py-[1px] text-[11px] font-medium"
              style={{ backgroundColor: `${category.color}18`, color: category.color }}
            >
              {category.label}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Edit ${block.title}`}
            onClick={onEdit}
            className="text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-ink"
          >
            <Pencil />
          </Button>
        </div>
        <span className="font-mono text-[11px] whitespace-nowrap text-ink-3">
          {formatDuration(block.end - block.start)}
        </span>
      </div>
    </div>
  )
}

function GapCard({
  start,
  end,
  use24h,
  onClick,
}: {
  start: number
  end: number
  use24h: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={`Add a block between ${formatTime(start, use24h)} and ${formatTime(end, use24h)}`}
      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-linesoft px-3 py-2 text-ink-3 transition-colors hover:border-line hover:bg-linesoft hover:text-ink-2"
    >
      <Plus className="size-3" strokeWidth={2} />
      <span className="font-mono text-[11px]">{formatDurationShort(end - start)}</span>
      <span className="text-[11px]">available</span>
    </button>
  )
}

function PastGap({ minutes }: { minutes: number }) {
  return (
    <div className="py-0.5 text-center font-mono text-[11px] text-ink-3">
      {formatDurationShort(minutes)}
    </div>
  )
}

function NowLine({ minutes, use24h }: { minutes: number; use24h: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="font-mono text-[12px] font-semibold text-primary">
        {formatTime(minutes, use24h)}
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
  const { data: me } = useMe()
  const use24h = me?.settings.time_format === "24h"
  const [date, setDate] = useState(() => new Date())
  const { dayStart, dayEnd } = useDayBounds()

  const { data: blocks = [], isPending } = useTimeBlocks(date)
  const createBlock = useCreateTimeBlock(date)
  const updateBlock = useUpdateTimeBlock(date)
  const deleteBlock = useDeleteTimeBlock(date)

  const { data: categories = [] } = useCategories("time_block")
  const { data: tasks = [] } = useIncompleteTasks()

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )
  const taskMap = useMemo(
    () => new Map(tasks.map((t) => [t.id, t.title])),
    [tasks],
  )

  const [editing, setEditing] = useState<Editing | undefined>(undefined)
  const nowMinutes = useNowMinutes()

  const { items, freeMinutes } = buildAgenda(blocks, dayCursor(date, nowMinutes), dayStart, dayEnd)

  const openingRange = () => {
    const gaps = items.filter((item) => item.kind === "gap")
    const target = gaps.find((gap) => !gap.isPast) ?? gaps[0]
    if (!target) return { start: dayStart, end: dayStart + 60 }
    const fitted = fitToGap(target.start, target.end)
    return { start: fitted.start, end: Math.min(fitted.end, fitted.start + 60) }
  }

  const save = async (draft: TimeBlockDraft) => {
    const target = editing?.block
    if (target) {
      await updateBlock.mutateAsync({ id: target.id, ...draft })
    } else {
      await createBlock.mutateAsync(draft)
    }
  }

  const remove = async (id: string) => {
    await deleteBlock.mutateAsync(id)
  }

  const summary = `${blocks.length} ${blocks.length === 1 ? "block" : "blocks"} · ${formatDuration(freeMinutes)} free`

  return (
    <div className="mx-auto max-w-[680px] px-8 pt-9 pb-16">
      <DayNav
        date={date}
        summary={summary}
        onChange={setDate}
        onAddBlock={() => setEditing({ range: openingRange() })}
      />

      <DayEdge label={formatTime(dayStart, use24h)} caption="day starts" className="mt-6 mb-3.5" />

      {isPending ? (
        <div className="py-10 text-center text-[13px] text-ink-3">Loading…</div>
      ) : blocks.length === 0 ? (
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
                  use24h={use24h}
                  onClick={() => setEditing({ range: fitToGap(item.start, item.end) })}
                />
              )
            }
            if (item.kind === "now-line") {
              return <NowLine key={item.key} minutes={item.at} use24h={use24h} />
            }
            return (
              <BlockCard
                key={item.key}
                block={item.block}
                state={item.state}
                nowPct={item.nowPct}
                use24h={use24h}
                onEdit={() =>
                  setEditing({
                    block: item.block,
                    range: { start: item.block.start, end: item.block.end },
                  })
                }
                category={item.block.category_id ? categoryMap.get(item.block.category_id) : undefined}
                taskTitle={item.block.task_id ? taskMap.get(item.block.task_id) : undefined}
              />
            )
          })}
        </div>
      )}

      <DayEdge label={formatTime(dayEnd, use24h)} caption="day ends" className="mt-3.5" />

      {items.some((item) => item.kind === "gap" && !item.isPast) && (
        <p className="mt-4.5 text-center text-[12px] text-ink-3">
          Gaps are fitted with {BUFFER_MINUTES} min buffers on each side.
        </p>
      )}

      <TimeBlockDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        block={editing?.block}
        range={editing?.range ?? { start: dayStart, end: dayStart + 60 }}
        blocks={blocks}
        use24h={use24h}
        dayStart={dayStart}
        dayEnd={dayEnd}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}
