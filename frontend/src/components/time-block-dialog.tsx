import { useMemo, useRef, useState, type FormEvent } from "react"
import { Check, ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react"
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
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/use-categories"
import { useIncompleteTasks } from "@/hooks/use-tasks"
import { CATEGORY_COLORS, fetchCategoryItemCount, type Category } from "@/lib/categories"
import {
  findOverlap,
  formatTime,
  fromTimeInput,
  toTimeInput,
  type TimeBlock,
  type TimeBlockDraft,
} from "@/lib/time-blocks"
import { cn } from "@/lib/utils"

const fieldClass =
  "h-auto w-full rounded-lg border border-line bg-transparent px-3 py-2.25 text-[13px] shadow-none"
const labelClass = "mb-1.5 text-xs text-muted-foreground"
const triggerClass =
  "flex h-auto w-full items-center gap-2 rounded-lg border border-line bg-transparent px-3 py-2.25 text-[13px] shadow-none text-left cursor-pointer hover:bg-muted/50 transition-colors"

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

function ColorDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-3 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  )
}

function NewCategoryForm({
  onCreated,
  onCancel,
}: {
  onCreated: (cat: Category) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState("")
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0].value)
  const createCategory = useCreateCategory("time_block")

  const save = async () => {
    if (!label.trim()) return
    const created = await createCategory.mutateAsync({ label: label.trim(), color, type: "time_block" })
    onCreated(created)
  }

  return (
    <div className="flex flex-col gap-2.5 border-t border-line p-2.5">
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void save() } }}
        placeholder="Category name"
        className="min-w-0 rounded-md border border-line bg-transparent px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring"
      />
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-label={c.name}
            className={cn(
              "flex size-6 items-center justify-center rounded-full transition-transform hover:scale-110",
              color === c.value && "ring-2 ring-ring ring-offset-2 ring-offset-popover",
            )}
            style={{ backgroundColor: c.value }}
            onClick={() => setColor(c.value)}
          >
            {color === c.value && <Check className="size-3 text-white" />}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-1.5">
        <Button type="button" variant="ghost" size="xs" onClick={onCancel}>Cancel</Button>
        <Button type="button" size="xs" disabled={!label.trim() || createCategory.isPending} onClick={save}>
          Add
        </Button>
      </div>
    </div>
  )
}

function EditCategoryForm({
  category,
  onDone,
  onDeleted,
}: {
  category: Category
  onDone: () => void
  onDeleted: () => void
}) {
  const [label, setLabel] = useState(category.label)
  const [color, setColor] = useState(category.color)
  const [confirmCount, setConfirmCount] = useState<number | null>(null)
  const update = useUpdateCategory("time_block")
  const remove = useDeleteCategory("time_block")

  const save = async () => {
    if (!label.trim()) return
    await update.mutateAsync({ id: category.id, changes: { label: label.trim(), color } })
    onDone()
  }

  const startDelete = async () => {
    const { count } = await fetchCategoryItemCount(category.id)
    if (count > 0) {
      setConfirmCount(count)
    } else {
      await remove.mutateAsync(category.id)
      onDeleted()
    }
  }

  const confirmDelete = async () => {
    await remove.mutateAsync(category.id)
    onDeleted()
  }

  const busy = update.isPending || remove.isPending

  return (
    <div className="flex flex-col gap-2.5 p-2.5">
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void save() } }}
        placeholder="Category name"
        className="min-w-0 rounded-md border border-line bg-transparent px-2.5 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring"
      />
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-label={c.name}
            className={cn(
              "flex size-6 items-center justify-center rounded-full transition-transform hover:scale-110",
              color === c.value && "ring-2 ring-ring ring-offset-2 ring-offset-popover",
            )}
            style={{ backgroundColor: c.value }}
            onClick={() => setColor(c.value)}
          >
            {color === c.value && <Check className="size-3 text-white" />}
          </button>
        ))}
      </div>
      {confirmCount !== null && (
        <div className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-[12px]">
          <span className="text-destructive">
            {confirmCount} time block{confirmCount === 1 ? "" : "s"} use{confirmCount === 1 ? "s" : ""} this category. Delete anyway?
          </span>
          <div className="flex justify-end gap-1.5">
            <Button type="button" variant="ghost" size="xs" onClick={() => setConfirmCount(null)}>Cancel</Button>
            <Button type="button" variant="destructive" size="xs" disabled={busy} onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      )}
      <div className="flex justify-between gap-1.5">
        <Button type="button" variant="ghost" size="xs" disabled={busy} onClick={startDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="size-3" />
          Delete
        </Button>
        <div className="flex gap-1.5">
          <Button type="button" variant="ghost" size="xs" onClick={onDone}>Cancel</Button>
          <Button type="button" size="xs" disabled={!label.trim() || busy} onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

function CategoryPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (categoryId: string | null) => void
}) {
  const { data: categories = [] } = useCategories("time_block")
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const selected = categories.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setCreating(false); setEditing(null) } }}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerClass} aria-label="Category">
          {selected ? (
            <>
              <ColorDot color={selected.color} />
              <span className="min-w-0 flex-1 truncate">{selected.label}</span>
              <X
                className="size-3.5 shrink-0 text-muted-foreground hover:text-ink"
                onClick={(e) => { e.stopPropagation(); onChange(null) }}
              />
            </>
          ) : (
            <>
              <span className="flex-1 text-muted-foreground">No category</span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {editing ? (
          <EditCategoryForm
            category={editing}
            onDone={() => setEditing(null)}
            onDeleted={() => { if (value === editing.id) onChange(null); setEditing(null) }}
          />
        ) : (
          <>
            <div className="max-h-48 overflow-y-auto p-1">
              {categories.length === 0 && !creating && (
                <div className="px-2.5 py-3 text-center text-[12px] text-muted-foreground">
                  No categories yet
                </div>
              )}
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] hover:bg-muted"
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2"
                    onClick={() => { onChange(cat.id); setOpen(false) }}
                  >
                    <ColorDot color={cat.color} />
                    <span className="min-w-0 flex-1 truncate">{cat.label}</span>
                    {cat.id === value && <Check className="size-3.5 shrink-0 text-primary" />}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 opacity-0 hover:bg-muted-foreground/20 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); setEditing(cat) }}
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
            {creating ? (
              <NewCategoryForm
                onCreated={(cat) => { onChange(cat.id); setCreating(false); setOpen(false) }}
                onCancel={() => setCreating(false)}
              />
            ) : (
              <div className="border-t border-line p-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground hover:bg-muted hover:text-ink"
                  onClick={() => setCreating(true)}
                >
                  <Plus className="size-3.5" />
                  New category
                </button>
              </div>
            )}
          </>
        )}
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
          <CategoryPicker value={categoryId} onChange={setCategoryId} />
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
