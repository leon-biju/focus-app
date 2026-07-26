import { useState, type KeyboardEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { todayTasksKey } from "@/hooks/use-tasks"
import { ApiError } from "@/lib/api"
import {
  createNote,
  deleteNote,
  fetchNotes,
  promoteNote,
  updateNote,
  type Note,
} from "@/lib/notes"
import type { Task } from "@/lib/tasks"

export const notesKey = ["notes"] as const

export function useNotes() {
  return useQuery({
    queryKey: notesKey,
    queryFn: fetchNotes,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createNote,
    onSuccess: (note) =>
      // Avoid a refetch here just by placing our new note on top
      // Exactly how it would look if we refetched anyway
      queryClient.setQueryData<Note[]>(notesKey, (prev) => [note, ...(prev ?? [])]),
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateNote,
    onSuccess: (updated) =>
      queryClient.setQueryData<Note[]>(notesKey, (prev) =>
        prev?.map((n) => (n.id === updated.id ? updated : n))
      ),
    onError: (error) => {
      // 409: someone else's edit was prioritised over ours so we just tell to try again
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: notesKey })
      }
    },
  })
}

// Note capture boxes live on several pages with different designs etc.
// This just holds the shared behaviour between all boxes
export function useNoteComposer(onCreated?: (note: Note) => void) {
  const [draft, setDraft] = useState("")
  const create = useCreateNote()

  const submit = () => {
    const content = draft.trim()
    if (!content || create.isPending) return
    create.mutate(content, {
      onSuccess: (note) => {
        setDraft("")
        onCreated?.(note)
      },
    })
  }

  // Enter submits, shift+enter is for newline
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return {
    draft,
    setDraft,
    submit,
    onKeyDown,
    isPending: create.isPending,
    canSubmit: draft.trim().length > 0 && !create.isPending,
  }
}

// One call moves it between two lists, so both caches are patched from the one response:
// the note is gone server-side and the task is new and open, so it goes on top.
export function usePromoteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: promoteNote,
    onSuccess: (task, id) => {
      queryClient.setQueryData<Note[]>(notesKey, (prev) => prev?.filter((n) => n.id !== id))
      queryClient.setQueryData<Task[]>(todayTasksKey, (prev) => [task, ...(prev ?? [])])
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteNote,
    onSuccess: (_result, id) =>
      queryClient.setQueryData<Note[]>(notesKey, (prev) => prev?.filter((n) => n.id !== id)),
  })
}
