import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/app-layout"
import { DashboardPage } from "@/pages/dashboard"
import { TimeBlockerPage } from "@/pages/time-blocker"
import { NotesPage } from "@/pages/notes"
import { FocusModePage } from "@/pages/focus-mode"
import { DailyLogPage } from "@/pages/daily-log"
import { PatternsPage } from "@/pages/patterns"
import { SettingsPage } from "@/pages/settings"

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/time-blocker" element={<TimeBlockerPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/focus" element={<FocusModePage />} />
        <Route path="/daily-log" element={<DailyLogPage />} />
        <Route path="/patterns" element={<PatternsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
