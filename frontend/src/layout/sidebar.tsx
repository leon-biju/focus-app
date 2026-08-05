import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  LayoutGrid,
  Rows3,
  ListCheck,
  Target,
  Moon,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrentUser, useLogout } from "@/features/auth/use-auth"
import { useMe } from "@/features/settings/use-settings"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/time-blocker", label: "Time Blocker", icon: Rows3 },
  { to: "/tasks", label: "Tasks", icon: ListCheck },
  { to: "/focus", label: "Focus Mode", icon: Target },
  { to: "/daily-log", label: "Daily Log", icon: Moon },
  { to: "/patterns", label: "Patterns", icon: BarChart3 },
]

export function Sidebar() {
  const { data: user } = useCurrentUser()
  const { data: me } = useMe()
  const logout = useLogout()
  const navigate = useNavigate()

  // Fall back to the email so this still reads right before /users/me lands
  const label = me?.profile.display_name ?? user?.email

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

      <DropdownMenu>
        <DropdownMenuTrigger className="mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-muted-foreground transition-colors hover:bg-linesoft data-[state=open]:bg-linesoft">
          <Avatar size="sm" className="flex-none">
            <AvatarFallback className="uppercase">{label?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
          <span className="truncate">{label ?? "Account"}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-48">
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to="/settings">
              <SettingsIcon strokeWidth={1.8} />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            disabled={logout.isPending}
            onSelect={() =>
              logout.mutate(undefined, {
                onSettled: () => navigate("/login", { replace: true }),
              })
            }
          >
            <LogOut strokeWidth={1.8} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
