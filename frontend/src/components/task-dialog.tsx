import { useState, type FormEvent } from "react"
import { Plus, Trash2, X } from "lucide-react"
import { CategoryPicker } from "@/components/category-picker"
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
import { useCreateTask, useDeleteTask, useUpdateTask } from "@/hooks/use-tasks"
import type { EnergyTag, MicroStep, Task } from "@/lib/tasks"
import { cn } from "@/lib/utils"

const fieldClass =
  "h-auto w-full rounded-lg border border-line bg-transparent px-3 py-2.25 text-[13px] shadow-none"
const labelClass = "mb-1.5 text-xs text-muted-foreground"

// "" stands in for the backend's null, since a <select> can't carry one
const energyOptions: { value: EnergyTag | ""; label: string }[] = [
  { value: "", label: "No tag" },
  { value: "low", label: "Low energy" },
  { value: "medium", label: "Medium energy" },
  { value: "high", label: "High energy" },
]

// A fresh task is a focus block until told otherwise
const DEFAULT_MINUTES = "25"

function TaskForm({ task, onSaved }: { task?: Task; onSaved: () => void }) {
  const create = useCreateTask()
  const update = useUpdateTask()
  const remove = useDeleteTask()

  const [title, setTitle] = useState(task?.title ?? "")
  const [titleTouched, setTitleTouched] = useState(false)
  const [minutes, setMinutes] = useState(task ? String(task.estimate_minutes) : DEFAULT_MINUTES)
  const [energy, setEnergy] = useState<EnergyTag | "">(task?.energy_tag ?? "")
  const [categoryId, setCategoryId] = useState<string | null>(task?.category_id ?? null)
  const [description, setDescription] = useState(task?.description ?? "")
  const [steps, setSteps] = useState<MicroStep[]>(task?.micro_steps ?? [])
  const [armed, setArmed] = useState(false)

  const parsedMinutes = Number(minutes)
  const minutesInvalid = !Number.isInteger(parsedMinutes) || parsedMinutes < 1
  const blankTitle = title.trim() === ""
  const saving = create.isPending || update.isPending
  const busy = saving || remove.isPending

  const editStep = (index: number, text: string) =>
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, text } : step)))

  const removeStep = (index: number) => setSteps((prev) => prev.filter((_, i) => i !== index))

  const destroy = () => {
    if (!task || busy) return
    if (!armed) {
      setArmed(true)
      return
    }
    remove.mutate(task.id, { onSuccess: onSaved })
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (blankTitle || minutesInvalid || busy) return

    const draft = {
      title: title.trim(),
      description: description.trim() || null,
      energy_tag: energy || null,
      estimate_minutes: parsedMinutes,
      category_id: categoryId,
      micro_steps: steps
        .filter((step) => step.text.trim() !== "")
        .map((step) => ({ ...step, text: step.text.trim() })),
    }

    // Stay open on failure: the global toast says what went wrong and the draft survives
    if (task) update.mutate({ id: task.id, ...draft }, { onSuccess: onSaved })
    else create.mutate(draft, { onSuccess: onSaved })
  }

  return (
    <form onSubmit={submit} className="grid gap-3.5">
      <div>
        <div className={labelClass}>Task</div>
        <Input
          autoFocus
          value={title}
          aria-label="Task title"
          aria-invalid={titleTouched && blankTitle}
          placeholder="What needs doing?"
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTitleTouched(true)}
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <div className={labelClass}>Estimate</div>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={minutes}
            aria-label="Estimate in minutes"
            aria-invalid={minutesInvalid}
            onChange={(e) => setMinutes(e.target.value)}
            className={cn(fieldClass, "font-mono")}
          />
          <div
            className={cn(
              "mt-1 text-[11px]",
              minutesInvalid ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {minutesInvalid ? "1 minute or more" : "minutes"}
          </div>
        </div>

        <div>
          <div className={labelClass}>Category</div>
          <CategoryPicker type="task" value={categoryId} onChange={setCategoryId} />
        </div>
      </div>

      <div>
        <div className={labelClass}>Energy</div>
        <select
          value={energy}
          aria-label="Energy tag"
          onChange={(e) => setEnergy(e.target.value as EnergyTag | "")}
          className={cn(
            fieldClass,
            "cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          )}
        >
          {energyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className={labelClass}>Notes</div>
        <Textarea
          rows={2}
          value={description}
          aria-label="Description"
          placeholder="Anything worth remembering when you start"
          onChange={(e) => setDescription(e.target.value)}
          className={cn(fieldClass, "resize-none")}
        />
      </div>

      <div>
        <div className={labelClass}>Micro-steps</div>
        {steps.length > 0 && (
          <div className="mb-2 flex max-h-40 flex-col gap-2 overflow-y-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <Input
                  value={step.text}
                  aria-label={`Step ${index + 1}`}
                  placeholder="One small step"
                  onChange={(e) => editStep(index, e.target.value)}
                  className={fieldClass}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove step ${index + 1}`}
                  onClick={() => removeStep(index)}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSteps((prev) => [...prev, { text: "", done: false }])}
        >
          <Plus />
          Add step
        </Button>
      </div>

      <DialogFooter className="mt-1">
        {task && (
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={destroy}
            // Clicking anywhere else counts as changing your mind
            onBlur={() => setArmed(false)}
            className="sm:mr-auto"
          >
            <Trash2 />
            {remove.isPending ? "Deleting…" : armed ? "Click again to delete" : "Delete task"}
          </Button>
        )}
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={blankTitle || minutesInvalid || busy}>
          {saving ? "Saving…" : task ? "Save changes" : "Add task"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// One dialog for both jobs: passing a task edits it, leaving it out creates one.
// The form only mounts while the dialog is open, so every open starts from the task as it is now.
export function TaskDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {task
              ? "Ticking it off still happens on the list, not here."
              : "One thing you want to get through today."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm task={task} onSaved={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
