import { get, patch } from "@/lib/api"

export type Theme = "light" | "dark"

// Mirrors backend's UserProfileRead
export interface UserProfile {
  id: string
  email: string
  // NOT NULL server-side, seeded from the email's username part at registration
  display_name: string
  created_at: string
}

// Mirrors backend's UserSettingsRead. day_start_time comes over as "HH:MM:SS"
export interface UserSettings {
  timezone: string
  day_start_time: string
  focus_minutes: number
  break_minutes: number
  flexible_timers: boolean
  theme: Theme
  updated_at: string
}

// Mirrors backend's UserMeRead
export interface UserMe {
  profile: UserProfile
  settings: UserSettings
}

// Mirrors UserSettingsUpdate: everything optional, and the backend drops both unset
// and null keys, so we only ever send the fields that actually changed.
export type SettingsPatch = Partial<Omit<UserSettings, "updated_at">>

export function fetchMe(): Promise<UserMe> {
  return get<UserMe>("/users/me")
}

export function updateSettings(changes: SettingsPatch): Promise<UserSettings> {
  return patch<UserSettings>("/users/me/settings", changes)
}

export function updateDisplayName(display_name: string): Promise<UserProfile> {
  return patch<UserProfile>("/users/me", { display_name })
}
