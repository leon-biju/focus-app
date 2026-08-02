import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api"
import { useMe } from "@/hooks/use-settings"
import {
  DAY_END,
  DAY_START,
  createTimeBlock,
  deleteTimeBlock,
  fetchTimeBlocks,
  formatDateParam,
  minutesToUtcIso,
  parseSettingsTime,
  toTimeBlock,
  updateTimeBlock,
  type TimeBlockDraft,
  type TimeBlockRow,
} from "@/lib/time-blocks"

export const timeBlocksKey = (date: string) => ["time-blocks", date] as const

export function useDayBounds() {
  const { data: me } = useMe()
  if (!me) return { dayStart: DAY_START, dayEnd: DAY_END }
  return {
    dayStart: parseSettingsTime(me.settings.day_start),
    dayEnd: parseSettingsTime(me.settings.day_end),
  }
}

export function useTimeBlocks(date: Date) {
  const { data: me } = useMe()
  const tz = me?.settings.timezone ?? "UTC"
  const dateStr = formatDateParam(date)

  return useQuery({
    queryKey: timeBlocksKey(dateStr),
    queryFn: () => fetchTimeBlocks(dateStr),
    select: (rows) => rows.map((r) => toTimeBlock(r, tz)),
    enabled: !!me,
  })
}

function writeBlock(qc: QueryClient, dateStr: string, updated: TimeBlockRow) {
  qc.setQueryData<TimeBlockRow[]>(timeBlocksKey(dateStr), (prev) =>
    prev?.map((b) => (b.id === updated.id ? updated : b)),
  )
}

export function useCreateTimeBlock(date: Date) {
  const { data: me } = useMe()
  const tz = me?.settings.timezone ?? "UTC"
  const dateStr = formatDateParam(date)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (draft: TimeBlockDraft) =>
      createTimeBlock({
        title: draft.title,
        description: draft.details,
        start_at: minutesToUtcIso(dateStr, draft.start, tz),
        end_at: minutesToUtcIso(dateStr, draft.end, tz),
        task_id: draft.task_id,
        category_id: draft.category_id,
      }),
    onSuccess: (created) => {
      qc.setQueryData<TimeBlockRow[]>(timeBlocksKey(dateStr), (prev) => [
        ...(prev ?? []),
        created,
      ])
    },
  })
}

export function useUpdateTimeBlock(date: Date) {
  const { data: me } = useMe()
  const tz = me?.settings.timezone ?? "UTC"
  const dateStr = formatDateParam(date)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...draft }: TimeBlockDraft & { id: string }) =>
      updateTimeBlock(id, {
        title: draft.title,
        description: draft.details,
        start_at: minutesToUtcIso(dateStr, draft.start, tz),
        end_at: minutesToUtcIso(dateStr, draft.end, tz),
        task_id: draft.task_id,
        category_id: draft.category_id,
      }),
    onSuccess: (updated) => writeBlock(qc, dateStr, updated),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void qc.invalidateQueries({ queryKey: timeBlocksKey(dateStr) })
      }
    },
  })
}

export function useDeleteTimeBlock(date: Date) {
  const dateStr = formatDateParam(date)
  const qc = useQueryClient()

  return useMutation({
    mutationFn: deleteTimeBlock,
    onSuccess: (_result, id) => {
      qc.setQueryData<TimeBlockRow[]>(timeBlocksKey(dateStr), (prev) =>
        prev?.filter((b) => b.id !== id),
      )
    },
  })
}
