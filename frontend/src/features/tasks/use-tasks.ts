import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api"
import {
  completeTask,
  createTask,
  deleteTask,
  fetchIncompleteTasks,
  fetchTodayTasks,
  uncompleteTask,
  updateMicroSteps,
  updateTask,
  type MicroStep,
  type Task,
} from "@/features/tasks/api"

export const todayTasksKey = ["tasks", "today"] as const
export const incompleteTasksKey = ["tasks", "incomplete"] as const

// The backend applies no ORDER BY, so sort the list here
// still-open tasks on top, newest first, with anything finished today sinking below them
function byOpenThenNewest(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aDone = a.status === "done"
    const bDone = b.status === "done"
    if (aDone !== bDone) return aDone ? 1 : -1
    return b.created_at.localeCompare(a.created_at)
  })
}

export function useTodayTasks() {
  return useQuery({
    queryKey: todayTasksKey,
    queryFn: fetchTodayTasks,
    select: byOpenThenNewest,
  })
}

export function useIncompleteTasks() {
  return useQuery({
    queryKey: incompleteTasksKey,
    queryFn: fetchIncompleteTasks,
  })
}

function writeTask(queryClient: QueryClient, updated: Task) {
  queryClient.setQueryData<Task[]>(todayTasksKey, (prev) =>
    prev?.map((t) => (t.id === updated.id ? updated : t))
  )
}

// Checkboxes have to fill in on click, so these mutations paint the expected row first and
// put the snapshot back if the request fails. The global mutation toast reports the error.
async function optimisticallyWrite(queryClient: QueryClient, expected: Task) {
  await queryClient.cancelQueries({ queryKey: todayTasksKey })
  const snapshot = queryClient.getQueryData<Task[]>(todayTasksKey)
  writeTask(queryClient, expected)
  return { snapshot }
}

function rollback(queryClient: QueryClient, error: Error, context?: { snapshot?: Task[] }) {
  if (context?.snapshot) {
    queryClient.setQueryData(todayTasksKey, context.snapshot)
  }
  // 409: another request got there first, so our snapshot is stale too
  if (error instanceof ApiError && error.status === 409) {
    void queryClient.invalidateQueries({ queryKey: todayTasksKey })
  }
}

export function useToggleTaskDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ task, done }: { task: Task; done: boolean }) =>
      done ? completeTask(task.id) : uncompleteTask(task.id),
    onMutate: ({ task, done }) =>
      optimisticallyWrite(queryClient, {
        ...task,
        status: done ? "done" : "not_started",
        completed_at: done ? new Date().toISOString() : null,
      }),
    onError: (error, _variables, context) => rollback(queryClient, error, context),
    onSuccess: (updated) => writeTask(queryClient, updated),
  })
}

export function useToggleMicroStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ task, micro_steps }: { task: Task; micro_steps: MicroStep[] }) =>
      updateMicroSteps({ id: task.id, micro_steps }),
    onMutate: ({ task, micro_steps }) => optimisticallyWrite(queryClient, { ...task, micro_steps }),
    onError: (error, _variables, context) => rollback(queryClient, error, context),
    onSuccess: (updated) => writeTask(queryClient, updated),
  })
}

// A brand new task is always open, so it belongs on top where the sort would put it anyway
export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTask,
    onSuccess: (task) =>
      queryClient.setQueryData<Task[]>(todayTasksKey, (prev) => [task, ...(prev ?? [])]),
  })
}

// Edits come from a dialog that waits for the save, so there's nothing to paint early here
export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (updated) => writeTask(queryClient, updated),
    onError: (error) => rollback(queryClient, error),
  })
}

// 204 back, so drop the row rather than asking the server what's left
export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_result, id) =>
      queryClient.setQueryData<Task[]>(todayTasksKey, (prev) => prev?.filter((t) => t.id !== id)),
  })
}

// Flipping one step means sending the whole array back, so build it next to the mutation
export function toggleStepAt(steps: MicroStep[], index: number): MicroStep[] {
  return steps.map((step, i) => (i === index ? { ...step, done: !step.done } : step))
}
