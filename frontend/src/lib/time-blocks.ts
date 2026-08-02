// TODO(api): derive from useMe().day_start / day_end
export const DAY_START = 8 * 60 // 08:00
export const DAY_END = 23 * 60 // 23:00

// Breathing room left on each side of a block created from a gap.
// TODO(api): becomes a user setting
export const BUFFER_MINUTES = 10

// Shorter than this and a gap isn't worth offering, or a block worth making
export const MIN_GAP_MINUTES = 15
export const MIN_BLOCK_MINUTES = 15

export type TimeBlock = {
  id: string
  title: string
  // No column for this on the backend yet — TimeBlockRead has title,
  // start_at, end_at, task_id, category_label and category_color. Wiring this
  // up needs either a new description column or a decision to reuse
  // category_label.
  details: string | null
  // Minutes from midnight. Integers keep every layout sum exact; converting to
  // and from the backend's timezone-aware start_at/end_at stays one boundary.
  start: number
  end: number
}

export function formatTime(minutes: number) {
  const hours24 = Math.floor(minutes / 60)
  const hours = ((hours24 + 11) % 12) + 1
  return `${hours}:${String(minutes % 60).padStart(2, "0")} ${hours24 < 12 ? "AM" : "PM"}`
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
export function buildAgenda(blocks: TimeBlock[], cursor: DayCursor) {
  const elapsed = elapsedThrough(cursor)
  const nowLine = cursor.kind === "today" ? cursor.now : null

  const sorted = [...blocks].sort((a, b) => a.start - b.start || a.end - b.end)
  const items: AgendaItem[] = []
  let at = DAY_START
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
  pushGap(at, DAY_END)

  // Nothing has carried the line yet: it falls on a seam between two blocks, or
  // in a sliver too short to have been shown
  const inBlock = items.some((item) => item.kind === "block" && item.state === "now")
  if (nowLine !== null && nowLine >= DAY_START && nowLine <= DAY_END && !nowPlaced && !inBlock) {
    const next = items.findIndex((item) => itemEnd(item) > nowLine)
    items.splice(next === -1 ? items.length : next, 0, {
      kind: "now-line",
      key: "now-line",
      at: nowLine,
    })
  }

  return { items, freeMinutes }
}
