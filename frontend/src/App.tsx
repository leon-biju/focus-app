import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/app-layout"
import { DashboardPage } from "@/pages/dashboard"
import { TimeBlockerPage } from "@/pages/time-blocker"
import { TasksPage } from "@/pages/tasks"
import { FocusModePage } from "@/pages/focus-mode"
import { DailyLogPage } from "@/pages/daily-log"
import { PatternsPage } from "@/pages/patterns"
import { SettingsPage } from "@/pages/settings"
import { LoginPage } from "@/pages/login"
import { RegisterPage } from "@/pages/register"
import { RequireAuth } from "@/components/require-auth"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/time-blocker" element={<TimeBlockerPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/focus" element={<FocusModePage />} />
          <Route path="/daily-log" element={<DailyLogPage />} />
          <Route path="/patterns" element={<PatternsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
