import { del, get, patch, post } from "@/lib/api"

export interface TimeBlockRow {
  id: string
  task_id: string | null
  title: string
  description: string | null
  category_id: string | null
  start_at: string
  end_at: string
  created_at: string
}

interface TimeBlockPayload {
  title: string
  description?: string | null
  start_at: string
  end_at: string
  task_id?: string | null
  category_id?: string | null
}

export function fetchTimeBlocks(date: string): Promise<TimeBlockRow[]> {
  return get<TimeBlockRow[]>(`/time-blocks?date=${date}`)
}

export function createTimeBlock(payload: TimeBlockPayload): Promise<TimeBlockRow> {
  return post<TimeBlockRow>("/time-blocks", payload)
}

export function updateTimeBlock(
  id: string,
  payload: Partial<TimeBlockPayload>,
): Promise<TimeBlockRow> {
  return patch<TimeBlockRow>(`/time-blocks/${id}`, payload)
}

export function deleteTimeBlock(id: string): Promise<void> {
  return del(`/time-blocks/${id}`)
}

export const DAY_START = 8 * 60 // 08:00
export const DAY_END = 23 * 60 // 23:00
export const BUFFER_MINUTES = 10
export const MIN_GAP_MINUTES = 15
export const MIN_BLOCK_MINUTES = 15

export type TimeBlock = {
  id: string
  title: string
  details: string | null
  task_id: string | null
  category_id: string | null
  start: number
  end: number
}

export type TimeBlockDraft = {
  title: string
  details: string | null
  task_id: string | null
  category_id: string | null
  start: number
  end: number
}

export function formatTime(minutes: number, use24h = false) {
  const hours24 = Math.floor(minutes / 60)
  const mins = String(minutes % 60).padStart(2, "0")
  if (use24h) return `${String(hours24).padStart(2, "0")}:${mins}`
  const hours = ((hours24 + 11) % 12) + 1
  return `${hours}:${mins} ${hours24 < 12 ? "AM" : "PM"}`
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours && rest) return `${hours} h ${rest} m`
  return hours ? `${hours} h` : `${rest} min`
}

// Tighter, for the small labels that only mark a length: "45m", "1h45m"
export function formatDurationShort(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours && rest) return `${hours}h${rest}m`
  return hours ? `${hours}h` : `${rest}m`
}

// <input type="time"> speaks "HH:MM"
export function toTimeInput(minutes: number) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0")
  return `${hours}:${String(minutes % 60).padStart(2, "0")}`
}

// NaN for a half-typed or cleared field, so validation catches it rather than
// silently reading as midnight
export function fromTimeInput(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return Number.NaN
  return Number(match[1]) * 60 + Number(match[2])
}

export function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export function parseSettingsTime(hms: string): number {
  const [h, m] = hms.split(":").map(Number)
  return h * 60 + m
}

export function formatDateParam(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getMinutesInTz(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date)
  const hour = Number(parts.find((p) => p.type === "hour")!.value)
  const minute = Number(parts.find((p) => p.type === "minute")!.value)
  return (hour === 24 ? 0 : hour) * 60 + minute
}

export function toTimeBlock(row: TimeBlockRow, tz: string): TimeBlock {
  return {
    id: row.id,
    title: row.title,
    details: row.description,
    task_id: row.task_id,
    category_id: row.category_id,
    start: getMinutesInTz(new Date(row.start_at), tz),
    end: getMinutesInTz(new Date(row.end_at), tz),
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

export function minutesToUtcIso(dateStr: string, minutes: number, tz: string): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const asUtc = new Date(`${dateStr}T${pad2(h)}:${pad2(m)}:00Z`)
  const inTz = getMinutesInTz(asUtc, tz)
  const offsetMin = inTz - (h * 60 + m)
  return new Date(asUtc.getTime() - offsetMin * 60_000).toISOString()
}

// Two blocks clash when each starts before the other ends
export function findOverlap(
  blocks: TimeBlock[],
  start: number,
  end: number,
  ignoreId?: string
) {
  return blocks.find((b) => b.id !== ignoreId && start < b.end && end > b.start) ?? null
}

// Inset a gap by the buffer on both sides, unless that leaves too little to be
// a block at all — then take the whole gap
export function fitToGap(start: number, end: number) {
  const inset = { start: start + BUFFER_MINUTES, end: end - BUFFER_MINUTES }
  return inset.end - inset.start >= MIN_BLOCK_MINUTES ? inset : { start, end }
}

export type BlockState = "past" | "now" | "upcoming"

export type AgendaItem =
  | { kind: "block"; key: string; block: TimeBlock; state: BlockState; nowPct: number }
  | { kind: "gap"; key: string; start: number; end: number; isPast: boolean }
  | { kind: "now-line"; key: string; at: number }

function itemEnd(item: AgendaItem) {
  if (item.kind === "block") return item.block.end
  if (item.kind === "gap") return item.end
  return item.at
}

// Where the viewed day sits relative to right now. A day that's been and gone
// is past all the way through, a day still coming hasn't started at all, and
// only today has a current time to draw.
export type DayCursor = { kind: "past" } | { kind: "future" } | { kind: "today"; now: number }

function startOfDay(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

export function dayCursor(date: Date, nowMinutes: number): DayCursor {
  const today = new Date()
  if (isSameDay(date, today)) return { kind: "today", now: nowMinutes }
  return startOfDay(date) < startOfDay(today) ? { kind: "past" } : { kind: "future" }
}

// Everything up to this minute has already happened. Pushing it to the
// infinities lets a whole past or future day fall out of the same comparison
// today uses, with no special cases downstream.
function elapsedThrough(cursor: DayCursor) {
  if (cursor.kind === "past") return Number.POSITIVE_INFINITY
  if (cursor.kind === "future") return Number.NEGATIVE_INFINITY
  return cursor.now
}

// The whole page in one pass: blocks in order, the free time between them, and
// where the current time falls.
export function buildAgenda(
  blocks: TimeBlock[],
  cursor: DayCursor,
  dayStart = DAY_START,
  dayEnd = DAY_END,
) {
  const elapsed = elapsedThrough(cursor)
  const nowLine = cursor.kind === "today" ? cursor.now : null

  const sorted = [...blocks].sort((a, b) => a.start - b.start || a.end - b.end)
  const items: AgendaItem[] = []
  let at = dayStart
  let freeMinutes = 0
  let nowPlaced = false

  // Free time too short to be worth offering still isn't shown as a gap
  const pushSpan = (start: number, end: number) => {
    if (end - start < MIN_GAP_MINUTES) return
    items.push({ kind: "gap", key: `gap-${start}`, start, end, isPast: end <= elapsed })
  }

  const pushGap = (start: number, end: number) => {
    if (end <= start) return
    // Every unbooked minute counts toward the summary, shown or not
    freeMinutes += end - start
    // A gap the current time runs through splits around it, so the line lands
    // where it really is rather than at the top of the whole span
    if (nowLine !== null && start < nowLine && nowLine < end) {
      pushSpan(start, nowLine)
      items.push({ kind: "now-line", key: "now-line", at: nowLine })
      nowPlaced = true
      pushSpan(nowLine, end)
      return
    }
    pushSpan(start, end)
  }

  for (const block of sorted) {
    if (block.start > at) pushGap(at, block.start)
    const isNow = nowLine !== null && block.start <= nowLine && nowLine < block.end
    const into = nowLine === null ? 0 : nowLine - block.start
    items.push({
      kind: "block",
      key: block.id,
      block,
      state: isNow ? "now" : block.end <= elapsed ? "past" : "upcoming",
      // How far into the block we are, so the line sits proportionally
      nowPct: isNow ? (into / (block.end - block.start)) * 100 : 0,
    })
    // max() so overlapping blocks can't open a negative gap behind them
    at = Math.max(at, block.end)
  }
  pushGap(at, dayEnd)

  // Nothing has carried the line yet: it falls on a seam between two blocks, or
  // in a sliver too short to have been shown
  const inBlock = items.some((item) => item.kind === "block" && item.state === "now")
  if (nowLine !== null && nowLine >= dayStart && nowLine <= dayEnd && !nowPlaced && !inBlock) {
    const next = items.findIndex((item) => itemEnd(item) > nowLine)
    items.splice(next === -1 ? items.length : next, 0, {
      kind: "now-line",
      key: "now-line",
      at: nowLine,
    })
  }

  return { items, freeMinutes }
}
