import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/sidebar"
import { useThemeSync } from "@/hooks/use-settings"

export function AppLayout() {
  // Signed in, so adopt the account's saved theme if this device has never picked one
  useThemeSync()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
