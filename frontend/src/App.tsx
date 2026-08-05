import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/layout/app-layout"
import { DashboardPage } from "@/features/dashboard/page"
import { TimeBlockerPage } from "@/features/time-blocker/page"
import { TasksPage } from "@/features/tasks/page"
import { FocusModePage } from "@/features/focus-mode/page"
import { DailyLogPage } from "@/features/daily-log/page"
import { PatternsPage } from "@/features/patterns/page"
import { SettingsPage } from "@/features/settings/page"
import { LoginPage } from "@/features/auth/login-page"
import { RegisterPage } from "@/features/auth/register-page"
import { RequireAuth } from "@/features/auth/require-auth"

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
