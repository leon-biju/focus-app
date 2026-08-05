import { useState } from "react"
import { Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/use-categories"
import { CATEGORY_COLORS, fetchCategoryItemCount, type Category, type CategoryType } from "@/lib/categories"
import { cn } from "@/lib/utils"

export const triggerClass =
  "flex h-auto w-full items-center gap-2 rounded-lg border border-line bg-transparent px-3 py-2.25 text-[13px] shadow-none text-left cursor-pointer hover:bg-muted/50 transition-colors"

export function ColorDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-3 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  )
}

function NewCategoryForm({
  type,
  onCreated,
  onCancel,
}: {
  type: CategoryType
  onCreated: (cat: Category) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState("")
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0].value)
  const createCategory = useCreateCategory(type)

  const save = async () => {
    if (!label.trim()) return
    const created = await createCategory.mutateAsync({ label: label.trim(), color, type })
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
  type,
  category,
  onDone,
  onDeleted,
}: {
  type: CategoryType
  category: Category
  onDone: () => void
  onDeleted: () => void
}) {
  const [label, setLabel] = useState(category.label)
  const [color, setColor] = useState(category.color)
  const [confirmCount, setConfirmCount] = useState<number | null>(null)
  const update = useUpdateCategory(type)
  const remove = useDeleteCategory(type)

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
            {confirmCount} item{confirmCount === 1 ? "" : "s"} use{confirmCount === 1 ? "s" : ""} this category. Delete anyway?
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

export function CategoryPicker({
  type,
  value,
  onChange,
}: {
  type: CategoryType
  value: string | null
  onChange: (categoryId: string | null) => void
}) {
  const { data: categories = [] } = useCategories(type)
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
            type={type}
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
                type={type}
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
