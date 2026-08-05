import { useMemo, useRef, useState, type FormEvent } from "react"
import { Check, ChevronDown, Search, Trash2, X } from "lucide-react"
import { CategoryPicker, triggerClass } from "@/shared/category-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { TimeField } from "@/components/ui/time-field"
import { useIncompleteTasks } from "@/features/tasks/use-tasks"
import {
  findOverlap,
  formatTime,
  fromTimeInput,
  toTimeInput,
  type TimeBlock,
  type TimeBlockDraft,
} from "@/features/time-blocker/api"
import { cn } from "@/lib/utils"

const fieldClass =
  "h-auto w-full rounded-lg border border-line bg-transparent px-3 py-2.25 text-[13px] shadow-none"
const labelClass = "mb-1.5 text-xs text-muted-foreground"

function fuzzyMatch(text: string, query: string): boolean {
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++
  }
  return qi === q.length
}

function TaskPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (taskId: string | null) => void
}) {
  const { data: tasks = [] } = useIncompleteTasks()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = tasks.find((t) => t.id === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks
    return tasks.filter((t) => fuzzyMatch(t.title, search))
  }, [tasks, search])

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch("") }}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerClass} aria-label="Linked task">
          {selected ? (
            <>
              <span className="min-w-0 flex-1 truncate">{selected.title}</span>
              <X
                className="size-3.5 shrink-0 text-muted-foreground hover:text-ink"
                onClick={(e) => { e.stopPropagation(); onChange(null) }}
              />
            </>
          ) : (
            <>
              <span className="flex-1 text-muted-foreground">No task linked</span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus() }}
      >
        <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="px-2.5 py-3 text-center text-[12px] text-muted-foreground">
              {tasks.length === 0 ? "No incomplete tasks" : "No matches"}
            </div>
          ) : (
            filtered.map((task) => (
              <button
                key={task.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
                onClick={() => { onChange(task.id); setOpen(false); setSearch("") }}
              >
                {task.id === value && <Check className="size-3.5 shrink-0 text-primary" />}
                <span className={cn("min-w-0 truncate", task.id !== value && "pl-5.5")}>{task.title}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function rangeProblem(
  start: number,
  end: number,
  blocks: TimeBlock[],
  ignoreId: string | undefined,
  dayStart: number,
  dayEnd: number,
  use24h: boolean,
) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Needs a start and an end"
  if (end <= start) return "Must end after it starts"
  if (start < dayStart || end > dayEnd) {
    return `Between ${formatTime(dayStart, use24h)} and ${formatTime(dayEnd, use24h)}`
  }
  const clash = findOverlap(blocks, start, end, ignoreId)
  return clash ? `Overlaps "${clash.title}"` : null
}

function TimeBlockForm({
  block,
  range,
  blocks,
  use24h,
  dayStart,
  dayEnd,
  onSave,
  onDelete,
  onDone,
}: {
  block?: TimeBlock
  range: { start: number; end: number }
  blocks: TimeBlock[]
  use24h: boolean
  dayStart: number
  dayEnd: number
  onSave: (draft: TimeBlockDraft) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDone: () => void
}) {
  const [title, setTitle] = useState(block?.title ?? "")
  const [titleTouched, setTitleTouched] = useState(false)
  const [start, setStart] = useState(toTimeInput(block?.start ?? range.start))
  const [end, setEnd] = useState(toTimeInput(block?.end ?? range.end))
  const [details, setDetails] = useState(block?.details ?? "")
  const [taskId, setTaskId] = useState<string | null>(block?.task_id ?? null)
  const [categoryId, setCategoryId] = useState<string | null>(block?.category_id ?? null)
  const [armed, setArmed] = useState(false)
  const [saving, setSaving] = useState(false)

  const startMinutes = fromTimeInput(start)
  const endMinutes = fromTimeInput(end)
  const blankTitle = title.trim() === ""
  const problem = rangeProblem(startMinutes, endMinutes, blocks, block?.id, dayStart, dayEnd, use24h)

  const destroy = async () => {
    if (!block) return
    if (!armed) {
      setArmed(true)
      return
    }
    setSaving(true)
    try {
      await onDelete(block.id)
      onDone()
    } catch {
      setSaving(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (blankTitle || problem || saving) return
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        details: details.trim() || null,
        task_id: taskId,
        category_id: categoryId,
        start: startMinutes,
        end: endMinutes,
      })
      onDone()
    } catch {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3.5">
      <div>
        <div className={labelClass}>Block</div>
        <Input
          autoFocus
          value={title}
          aria-label="Block title"
          aria-invalid={titleTouched && blankTitle}
          placeholder="What is this time for?"
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTitleTouched(true)}
          className={fieldClass}
        />
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <div className={labelClass}>Starts</div>
            <TimeField
              value={start}
              use24h={use24h}
              aria-label="Start time"
              aria-invalid={problem !== null}
              onChange={setStart}
            />
          </div>
          <div>
            <div className={labelClass}>Ends</div>
            <TimeField
              value={end}
              use24h={use24h}
              aria-label="End time"
              aria-invalid={problem !== null}
              onChange={setEnd}
            />
          </div>
        </div>
        <div
          className={cn("mt-1 text-[11px]", problem ? "text-destructive" : "text-muted-foreground")}
        >
          {problem ?? `${formatTime(dayStart, use24h)} – ${formatTime(dayEnd, use24h)}`}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <div className={labelClass}>Task</div>
          <TaskPicker value={taskId} onChange={setTaskId} />
        </div>
        <div>
          <div className={labelClass}>Category</div>
          <CategoryPicker type="time_block" value={categoryId} onChange={setCategoryId} />
        </div>
      </div>

      <div>
        <div className={labelClass}>Details</div>
        <Textarea
          rows={2}
          value={details}
          aria-label="Details"
          placeholder="Anything worth remembering when this starts"
          onChange={(e) => setDetails(e.target.value)}
          className={cn(fieldClass, "resize-none")}
        />
      </div>

      <DialogFooter className="mt-1">
        {block && (
          <Button
            type="button"
            variant="destructive"
            onClick={destroy}
            disabled={saving}
            onBlur={() => setArmed(false)}
            className="sm:mr-auto"
          >
            <Trash2 />
            {armed ? "Click again to delete" : "Delete block"}
          </Button>
        )}
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={blankTitle || problem !== null || saving}>
          {block ? "Save changes" : "Add block"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function TimeBlockDialog({
  open,
  onOpenChange,
  block,
  range,
  blocks,
  use24h = false,
  dayStart,
  dayEnd,
  onSave,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  block?: TimeBlock
  range: { start: number; end: number }
  blocks: TimeBlock[]
  use24h?: boolean
  dayStart: number
  dayEnd: number
  onSave: (draft: TimeBlockDraft) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{block ? "Edit time block" : "New time block"}</DialogTitle>
          <DialogDescription>
            {block
              ? "Moving it here reflows the free time around it."
              : "Times are fitted to the space you picked — adjust them if you like."}
          </DialogDescription>
        </DialogHeader>
        <TimeBlockForm
          block={block}
          range={range}
          blocks={blocks}
          use24h={use24h}
          dayStart={dayStart}
          dayEnd={dayEnd}
          onSave={onSave}
          onDelete={onDelete}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
