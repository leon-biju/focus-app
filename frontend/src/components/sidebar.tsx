import { NavLink } from "react-router-dom"
import {
  LayoutGrid,
  Rows3,
  NotebookText,
  Target,
  Moon,
  BarChart3,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/time-blocker", label: "Time Blocker", icon: Rows3 },
  { to: "/notes", label: "Notes", icon: NotebookText },
  { to: "/focus", label: "Focus Mode", icon: Target },
  { to: "/daily-log", label: "Daily Log", icon: Moon },
  { to: "/patterns", label: "Patterns", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
]

export function Sidebar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="flex w-56 flex-none flex-col border-r border-border px-3 py-5 box-border">
      <div className="flex items-center gap-2.5 px-2.5 pb-4">
        <div className="grid size-7 flex-none place-items-center rounded-full bg-primary">
          <div className="size-2.5 rounded-full border-2 border-primary-foreground" />
        </div>
        <div className="font-heading text-[19px] font-bold tracking-tight">Focus</div>
      </div>

      <div className="flex flex-col gap-0.5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-linesoft",
                isActive && "bg-accent text-accent-foreground hover:bg-accent"
              )
            }
          >
            <Icon className="size-4" strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="flex-1" />

      <NavLink
        to="/focus"
        className="flex items-center justify-center gap-2 rounded-[9px] bg-primary px-3 py-2.5 text-[13.5px] font-semibold text-primary-foreground shadow-[var(--shadow)] transition-[filter] hover:brightness-[1.06]"
      >
        Start focusing
      </NavLink>
      <button
        onClick={toggleTheme}
        className="mt-2.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] text-muted-foreground transition-colors hover:bg-linesoft"
      >
        {theme === "dark" ? <Sun className="size-3.5" strokeWidth={1.8} /> : <Moon className="size-3.5" strokeWidth={1.8} />}
        {theme === "dark" ? "Switch to light" : "Switch to dark"}
      </button>
    </nav>
  )
}
