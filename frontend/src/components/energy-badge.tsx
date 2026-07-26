import type { EnergyTag } from "@/lib/tasks"
import { cn } from "@/lib/utils"

const styles: Record<EnergyTag, { label: string; className: string }> = {
  high: { label: "High energy", className: "bg-amber-soft text-amber" },
  medium: { label: "Medium energy", className: "bg-green-soft text-green" },
  low: { label: "Low energy", className: "bg-blue-soft text-blue" },
}

// Tagging is optional on the backend, so an untagged task just gets no badge
export function EnergyBadge({ level, className }: { level: EnergyTag | null; className?: string }) {
  if (!level) return null
  const s = styles[level]
  return (
    <span
      className={cn(
        "rounded-full px-2 py-[3px] text-[11px] font-semibold",
        s.className,
        className
      )}
    >
      {s.label}
    </span>
  )
}
