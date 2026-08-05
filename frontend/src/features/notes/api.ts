import { get, post, patch, del } from "@/lib/api"
import type { Task } from "@/features/tasks/api"

// Same as backend's NoteRead
export interface Note {
  id: string
  content: string
  created_at: string
  version_id: number
}

export interface NoteUpdate {
  id: string
  content: string
  version_id: number
}

export function fetchNotes(): Promise<Note[]> {
  return get<Note[]>("/notes")
}

export function createNote(content: string): Promise<Note> {
  return post<Note>("/notes", { content })
}

export function updateNote({ id, content, version_id }: NoteUpdate): Promise<Note> {
  return patch<Note>(`/notes/${id}`, { content, version_id })
}

export function deleteNote(id: string): Promise<void> {
  return del(`/notes/${id}`)
}

// Spends the note: the backend makes the task and deletes the note in one call,
// so the new task comes back instead of the note
export function promoteNote(id: string): Promise<Task> {
  return post<Task>(`/notes/${id}/promote`)
}
