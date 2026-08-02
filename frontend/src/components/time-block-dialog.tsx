import { useState, type FormEvent } from "react"
import { Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  DAY_END,
  DAY_START,
  findOverlap,
  formatTime,
  fromTimeInput,
  toTimeInput,
  type TimeBlock,
} from "@/lib/time-blocks"
import { cn } from "@/lib/utils"

// The field idiom the task dialog uses; each dialog keeps its own copy rather
// than importing a dialog for its style strings
const fieldClass =
  "h-auto w-full rounded-lg border border-line bg-transparent px-3 py-2.25 text-[13px] shadow-none"
const labelClass = "mb-1.5 text-xs text-muted-foreground"

export type TimeBlockDraft = {
  title: string
  details: string | null
  start: number
  end: number
}

// One message at a time, most fundamental first — a block that ends before it
// starts has nothing useful to say about overlapping anything
function rangeProblem(start: number, end: number, blocks: TimeBlock[], ignoreId?: string) {
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Needs a start and an end"
  if (end <= start) return "Must end after it starts"
  if (start < DAY_START || end > DAY_END) {
    return `Between ${formatTime(DAY_START)} and ${formatTime(DAY_END)}`
  }
  const clash = findOverlap(blocks, start, end, ignoreId)
  return clash ? `Overlaps “${clash.title}”` : null
}

function TimeBlockForm({
  block,
  range,
  blocks,
  onSave,
  onDelete,
  onDone,
}: {
  block?: TimeBlock
  range: { start: number; end: number }
  blocks: TimeBlock[]
  onSave: (draft: TimeBlockDraft) => void
  onDelete: (id: string) => void
  onDone: () => void
}) {
  const [title, setTitle] = useState(block?.title ?? "")
  const [titleTouched, setTitleTouched] = useState(false)
  const [start, setStart] = useState(toTimeInput(block?.start ?? range.start))
  const [end, setEnd] = useState(toTimeInput(block?.end ?? range.end))
  const [details, setDetails] = useState(block?.details ?? "")
  // Deleting can't be undone and the button sits a click away from Save, so it asks twice
  const [armed, setArmed] = useState(false)

  const startMinutes = fromTimeInput(start)
  const endMinutes = fromTimeInput(end)
  const blankTitle = title.trim() === ""
  const problem = rangeProblem(startMinutes, endMinutes, blocks, block?.id)

  const destroy = () => {
    if (!block) return
    if (!armed) {
      setArmed(true)
      return
    }
    // TODO(api): useDeleteTimeBlock — close on success instead
    onDelete(block.id)
    onDone()
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (blankTitle || problem) return
    // TODO(api): useCreateTimeBlock / useUpdateTimeBlock — stay open on failure
    // so the global toast explains and the draft survives
    onSave({
      title: title.trim(),
      details: details.trim() || null,
      start: startMinutes,
      end: endMinutes,
    })
    onDone()
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
            <Input
              type="time"
              value={start}
              aria-label="Start time"
              aria-invalid={problem !== null}
              onChange={(e) => setStart(e.target.value)}
              className={cn(fieldClass, "font-mono")}
            />
          </div>
          <div>
            <div className={labelClass}>Ends</div>
            <Input
              type="time"
              value={end}
              aria-label="End time"
              aria-invalid={problem !== null}
              onChange={(e) => setEnd(e.target.value)}
              className={cn(fieldClass, "font-mono")}
            />
          </div>
        </div>
        <div
          className={cn("mt-1 text-[11px]", problem ? "text-destructive" : "text-muted-foreground")}
        >
          {problem ?? `${formatTime(DAY_START)} – ${formatTime(DAY_END)}`}
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
            // Clicking anywhere else counts as changing your mind
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
        <Button type="submit" disabled={blankTitle || problem !== null}>
          {block ? "Save changes" : "Add block"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// One dialog for both jobs: passing a block edits it, passing only a range
// creates one there. The form only mounts while the dialog is open, so every
// open starts from the block as it is now.
export function TimeBlockDialog({
  open,
  onOpenChange,
  block,
  range,
  blocks,
  onSave,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  block?: TimeBlock
  range: { start: number; end: number }
  blocks: TimeBlock[]
  onSave: (draft: TimeBlockDraft) => void
  onDelete: (id: string) => void
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
          onSave={onSave}
          onDelete={onDelete}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
