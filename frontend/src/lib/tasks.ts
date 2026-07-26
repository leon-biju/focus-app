import { get, post, patch, del } from "@/lib/api"

export type EnergyTag = "low" | "medium" | "high"
export type TaskStatus = "not_started" | "in_progress" | "done"

export interface MicroStep {
  text: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  description: string | null
  energy_tag: EnergyTag | null
  estimate_minutes: number
  actual_minutes: number | null
  status: TaskStatus
  micro_steps: MicroStep[]
  created_at: string
  completed_at: string | null
}

export interface MicroStepsUpdate {
  id: string
  micro_steps: MicroStep[]
}

// The editable half of a task. Status is missing on purpose: the backend forbids it in
// TaskUpdate, completion goes through /done instead.
export interface TaskDraft {
  title: string
  description: string | null
  energy_tag: EnergyTag | null
  estimate_minutes: number
  micro_steps: MicroStep[]
}

export function createTask(draft: TaskDraft): Promise<Task> {
  return post<Task>("/tasks", draft)
}

export function updateTask({ id, ...changes }: TaskDraft & { id: string }): Promise<Task> {
  return patch<Task>(`/tasks/${id}`, changes)
}

export function deleteTask(id: string): Promise<void> {
  return del(`/tasks/${id}`)
}

// Not-done tasks of any age, plus whatever was completed today
export function fetchTodayTasks(): Promise<Task[]> {
  return get<Task[]>("/tasks/today")
}

export function completeTask(id: string): Promise<Task> {
  return post<Task>(`/tasks/${id}/done`)
}

export function uncompleteTask(id: string): Promise<Task> {
  return del<Task>(`/tasks/${id}/done`)
}

export function updateMicroSteps({ id, micro_steps }: MicroStepsUpdate): Promise<Task> {
  return patch<Task>(`/tasks/${id}`, { micro_steps })
}
