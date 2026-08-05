import { useState } from "react"
import { ListPlus, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  useDeleteNote,
  useNoteComposer,
  useNotes,
  usePromoteNote,
  useUpdateNote,
} from "@/features/notes/use-notes"
import type { Note } from "@/features/notes/api"
import type { Task } from "@/features/tasks/api"

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1)
    return "just now";
  if (mins < 60)
    return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24)
    return `${hours}h ago`;

  const days = Math.floor(hours / 24)
  if (days === 1)
    return "yesterday"

  return `${days}d ago`
}

function NoteCard({ note, onPromoted }: { note: Note; onPromoted?: (task: Task) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const update = useUpdateNote()
  const remove = useDeleteNote()
  const promote = usePromoteNote()
  const editing = draft !== null

  const save = () => {
    const content = draft?.trim()
    setDraft(null)
    if (!content || content === note.content) {
      return
    }
    // version_id is the one this card rendered from, so a note edited in another
    // tab comes back 409 instead of losing that edit.
    update.mutate({ id: note.id, content, version_id: note.version_id })
  }

  return (
    <div className="group relative rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-ink-3/50">
      {editing ? (
        <Textarea
          autoFocus
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDraft(null)
            // Same deal as the composer: enter saves, shift+enter is a newline
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              save()
            }
          }}
          className="resize-none border-none p-0 text-[13px] leading-snug shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      ) : (
        <button
          onClick={() => setDraft(note.content)}
          className="block w-full cursor-text break-words whitespace-pre-wrap pr-14 text-left text-[13px] leading-snug"
        >
          {note.content}
        </button>
      )}

      <span className="mt-1 block font-mono text-[10px] text-ink-3">
        {editing ? "ENTER to save · esc to cancel" : timeAgo(note.created_at)}
      </span>

      {!editing && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            title="Make a task"
            disabled={promote.isPending}
            // The task lands with a placeholder estimate and no tag, so hand it
            // straight to whoever can open it for a once-over
            onClick={() => promote.mutate(note.id, { onSuccess: onPromoted })}
            className="grid size-6 cursor-pointer place-items-center rounded-md text-ink-3 hover:bg-accent-soft hover:text-primary disabled:opacity-50"
          >
            <ListPlus className="size-3.5" strokeWidth={1.8} />
          </button>
          <button
            title="Delete note"
            disabled={remove.isPending}
            onClick={() => remove.mutate(note.id)}
            className="grid size-6 cursor-pointer place-items-center rounded-md text-ink-3 hover:bg-linesoft hover:text-destructive disabled:opacity-50"
          >
            <X className="size-3.5" strokeWidth={1.8} />
          </button>
        </div>
      )}
    </div>
  )
}

export function NotesPanel({ onPromoted }: { onPromoted?: (task: Task) => void }) {
  const { data: notes, isPending, isError } = useNotes()
  const composer = useNoteComposer()

  return (
    <section className="flex min-h-0 flex-col border-b border-border lg:w-[42%] lg:border-r lg:border-b-0">
      <div className="flex-none px-8 pt-9 pb-4">
        <div className="flex items-baseline justify-between">
          <h1 className="font-heading text-[22px] font-semibold tracking-tight">Notes</h1>
          <span className="text-[11.5px] text-ink-3">{notes ? `${notes.length} notes` : ""}</span>
        </div>

        <div className="mt-4 rounded-2xl border-2 border-primary bg-card p-4 shadow-[var(--shadow)]">
          <Textarea
            rows={3}
            value={composer.draft}
            onChange={(e) => composer.setDraft(e.target.value)}
            onKeyDown={composer.onKeyDown}
            placeholder="Enter any thoughts that come to mind here."
            className="resize-none border-none p-0 text-[14.5px] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-2 flex items-center justify-between">
            <Button size="sm" disabled={!composer.canSubmit} onClick={composer.submit}>
              {composer.isPending ? "Adding…" : "Add Note"}
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-1 pb-10">
        <div className="flex flex-col gap-1.5">
          {notes?.map((n) => <NoteCard key={n.id} note={n} onPromoted={onPromoted} />)}
        </div>

        {isPending && <p className="py-10 text-center text-[13px] text-ink-3">Loading notes…</p>}
        {isError && (
          <p className="py-10 text-center text-[13px] text-ink-3">
            Couldn't load your notes. Try reloading.
          </p>
        )}
        {notes?.length === 0 && (
          <p className="py-10 text-center text-[13px] text-ink-3">
            Nothing here yet, park your first stray thought above.
          </p>
        )}
      </div>
    </section>
  )
}
