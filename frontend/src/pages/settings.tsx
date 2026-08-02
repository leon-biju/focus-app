import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/theme-provider"
import { useLogout } from "@/hooks/use-auth"
import { useMe, useUpdateDisplayName, useUpdateSettings } from "@/hooks/use-settings"
import type { SettingsPatch, Theme, UserProfile, UserSettings } from "@/lib/users"

// Matches the ge/le bounds on the backend's UserSettingsUpdate
const FOCUS_MIN = 5
const FOCUS_MAX = 180
const BREAK_MIN = 1
const BREAK_MAX = 60

const EARLIEST_DAY_START = "04:00"

// Not every runtime has supportedValuesOf, and an empty list just means the picker
// falls back to whatever is already saved rather than blowing up the page.
const allTimezones: string[] =
  typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []
const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

const cardClass = "rounded-xl border border-border bg-card px-5.5 py-5 shadow-[var(--shadow)]"
const fieldClass =
  "h-auto w-full rounded-lg border border-line bg-transparent px-3 py-2.25 font-mono text-[13px] shadow-none"

function formatClock(hhmm: string): string {
  const [hours, minutes] = hhmm.split(":").map(Number)
  const at = new Date()
  at.setHours(hours, minutes, 0, 0)
  return at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

// How long they've been here reads warmer than the raw join date, and it's the only
// thing anyone actually wants from created_at
function membership(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
  if (days < 1) return "Joined today"
  if (days < 30) return `Member for ${days} ${days === 1 ? "day" : "days"}`

  const months = Math.floor(days / 30)
  if (months < 12) return `Member for ${months} ${months === 1 ? "month" : "months"}`

  const years = Math.floor(days / 365)
  return `Member for ${years} ${years === 1 ? "year" : "years"}`
}

function initials(profile: UserProfile): string {
  const words = profile.display_name.split(/\s+/).filter(Boolean)
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return profile.display_name.slice(0, 2).toUpperCase()
}

// Binary and low-stakes, so it rides along in the identity card's footer strip rather
// than taking a heading and a card of its own
function ThemeToggle({ save }: { save: (changes: SettingsPatch) => void }) {
  const { theme, setTheme } = useTheme()

  // Paint locally first (that's what survives a reload), then sync so a new device picks it up
  const choose = (next: Theme) => {
    if (next === theme) return
    setTheme(next)
    save({ theme: next })
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex gap-0.5 rounded-[7px] border border-line p-0.5"
    >
      {(["light", "dark"] as const).map((option) => (
        <button
          key={option}
          onClick={() => choose(option)}
          aria-pressed={theme === option}
          className={`cursor-pointer rounded-[5px] px-2.5 py-1 text-[11.5px] font-medium capitalize transition-colors ${
            theme === option
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

// Who am I in this app: the facts are read-only, the name is the one thing to change
function IdentityCard({
  profile,
  saveName,
  saveSettings,
}: {
  profile: UserProfile
  saveName: (displayName: string) => void
  saveSettings: (changes: SettingsPatch) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const current = profile.display_name
  // There's no "clear it" state: the column is NOT NULL and the backend rejects a blank
  // name, so an empty box stays put with the hint rather than being sent and bounced
  const blank = draft !== null && draft.trim() === ""

  const commit = () => {
    if (draft === null || blank) return
    // Trimmed to match what the backend stores, so the next diff doesn't resave
    const next = draft.trim()
    setDraft(null)
    if (next !== current) saveName(next)
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-3.5">
        <Avatar className="size-11 flex-none">
          <AvatarFallback className="bg-violet-soft font-semibold text-violet">
            {initials(profile)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Input
            value={draft ?? current}
            maxLength={80}
            aria-invalid={blank}
            aria-label="Display name"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
              if (e.key === "Escape") setDraft(null)
            }}
            className="h-auto border-none p-0 text-[15px] font-semibold shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div
            className={`mt-0.5 truncate text-[12.5px] ${
              blank ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {blank ? "Display name can't be blank" : profile.email}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-linesoft pt-3.5">
        <span className="text-[12.5px] text-muted-foreground">
          {membership(profile.created_at)}
        </span>
        <ThemeToggle save={saveSettings} />
      </div>
    </div>
  )
}

// Whole-minute setting that saves on blur. A draft of null means "showing the server value";
// an out-of-range draft stays on screen with the range spelled out instead of being
// silently dropped or bounced back by a 422.
function MinutesField({
  label,
  value,
  min,
  max,
  onCommit,
}: {
  label: string
  value: number
  min: number
  max: number
  onCommit: (minutes: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const parsed = draft === null ? value : Number(draft)
  const invalid = draft !== null && (!Number.isInteger(parsed) || parsed < min || parsed > max)

  const commit = () => {
    if (draft === null || invalid) return
    setDraft(null)
    if (parsed !== value) onCommit(parsed)
  }

  return (
    <div>
      <div className="mb-1.5 text-xs text-muted-foreground">{label}</div>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft ?? String(value)}
        aria-invalid={invalid}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") setDraft(null)
        }}
        className={fieldClass}
      />
      <div className={`mt-1 text-[11px] ${invalid ? "text-destructive" : "text-muted-foreground"}`}>
        {invalid ? `${min}–${max} minutes` : "minutes"}
      </div>
    </div>
  )
}

// How the app behaves for me. Timers and the day boundary are two different PATCH bodies
// but one mental model, so they share a card instead of being filed apart.
function PreferencesCard({
  settings,
  save,
}: {
  settings: UserSettings
  save: (changes: SettingsPatch) => void
}) {
  const serverStart = settings.day_start.slice(0, 5)
  const serverEnd = settings.day_end.slice(0, 5)
  const [draft, setDraft] = useState<string | null>(null)
  const [endDraft, setEndDraft] = useState<string | null>(null)
  const start = draft ?? serverStart
  const end = endDraft ?? serverEnd
  const invalidStart = start < EARLIEST_DAY_START
  const invalidEnd = end !== "" && start !== "" && end <= start

  const commitStart = () => {
    if (draft === null || invalidStart) return
    setDraft(null)
    if (start !== serverStart) save({ day_start: start })
  }

  const commitEnd = () => {
    if (endDraft === null || invalidEnd) return
    setEndDraft(null)
    if (end !== serverEnd) save({ day_end: end })
  }

  const zones = useMemo(
    () =>
      allTimezones.includes(settings.timezone)
        ? allTimezones
        : [settings.timezone, ...allTimezones],
    [settings.timezone]
  )

  return (
    <div className={cardClass}>
      <div className="text-[13px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
        Preferences
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-3.5">
        <MinutesField
          label="Focus length"
          value={settings.focus_minutes}
          min={FOCUS_MIN}
          max={FOCUS_MAX}
          onCommit={(focus_minutes) => save({ focus_minutes })}
        />
        <MinutesField
          label="Break"
          value={settings.break_minutes}
          min={BREAK_MIN}
          max={BREAK_MAX}
          onCommit={(break_minutes) => save({ break_minutes })}
        />
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-4">
        <label htmlFor="flexible-timers" className="cursor-pointer">
          <div className="text-[13.5px] font-medium">Flexible timers</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Timer bends to you — overruns don't count as failure
          </div>
        </label>
        <Switch
          id="flexible-timers"
          checked={settings.flexible_timers}
          onCheckedChange={(flexible_timers) => save({ flexible_timers })}
        />
      </div>

      <div className="mt-4.5 grid grid-cols-3 gap-3.5 border-t border-linesoft pt-4.5">
        <div className="col-span-3">
          <div className="mb-1.5 text-xs text-muted-foreground">Timezone</div>
          <select
            value={settings.timezone}
            aria-label="Timezone"
            onChange={(e) => save({ timezone: e.target.value })}
            className={`${fieldClass} cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`}
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1.5 text-xs text-muted-foreground">Day starts</div>
          <Input
            type="time"
            value={start}
            aria-invalid={invalidStart}
            aria-label="Day start time"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitStart}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
              if (e.key === "Escape") setDraft(null)
            }}
            className={fieldClass}
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs text-muted-foreground">Day ends</div>
          <Input
            type="time"
            value={end}
            aria-invalid={invalidEnd}
            aria-label="Day end time"
            onChange={(e) => setEndDraft(e.target.value)}
            onBlur={commitEnd}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
              if (e.key === "Escape") setEndDraft(null)
            }}
            className={fieldClass}
          />
        </div>
      </div>

      <div
        className={`mt-2.5 text-[11.5px] ${
          invalidStart || invalidEnd ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {invalidStart
          ? "Day start must be 4:00 AM or later"
          : invalidEnd
            ? "Day end must be after day start"
            : `Your day runs ${formatClock(start)} → ${formatClock(end)}, ${settings.timezone} time.`}
      </div>

      {settings.timezone !== systemTimezone && (
        <button
          onClick={() => save({ timezone: systemTimezone })}
          className="mt-1 cursor-pointer text-[11.5px] text-primary hover:underline"
        >
          Use this device's timezone ({systemTimezone})
        </button>
      )}
    </div>
  )
}

// An exit, not a setting: detached below the cards and muted so it doesn't pull the eye
// away from the things people actually came here to change
function SessionFooter({ email }: { email?: string }) {
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-linesoft px-1 pt-4">
      <span className="truncate text-[12.5px] text-muted-foreground">
        {email ? `Signed in as ${email}` : "Signed in"}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={logout.isPending}
        onClick={() =>
          logout.mutate(undefined, {
            onSettled: () => navigate("/login", { replace: true }),
          })
        }
        className="flex-none cursor-pointer"
      >
        <LogOut strokeWidth={1.8} />
        {logout.isPending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  )
}

export function SettingsPage() {
  const { data, isPending, isError } = useMe()
  const settings = useUpdateSettings()
  const displayName = useUpdateDisplayName()

  const saving = settings.isPending || displayName.isPending

  return (
    <div className="mx-auto max-w-[680px] px-11 pt-10 pb-16">
      <div className="mb-6 flex items-baseline gap-3">
        <h1 className="font-heading text-[28px] font-semibold tracking-tight">Settings</h1>
        <span className="text-[12px] text-muted-foreground">
          {saving ? "Saving…" : ""}
        </span>
      </div>

      {isPending && <p className="py-10 text-center text-[13px] text-ink-3">Loading settings…</p>}
      {isError && (
        <p className="py-10 text-center text-[13px] text-ink-3">
          Couldn't load your settings. Try reloading.
        </p>
      )}

      <div className="flex flex-col gap-4.5">
        {data && (
          <>
            <IdentityCard
              profile={data.profile}
              saveName={displayName.mutate}
              saveSettings={settings.mutate}
            />
            <PreferencesCard settings={data.settings} save={settings.mutate} />
          </>
        )}
        {/* Outside the data guard: signing out has to stay reachable even if /users/me won't load */}
        <SessionFooter email={data?.profile.email} />
      </div>
    </div>
  )
}
