import { cn } from "@/lib/utils"

export type EnergyLevel = "high" | "steady" | "low"

const styles: Record<EnergyLevel, { label: string; className: string }> = {
  high: { label: "High energy", className: "bg-amber-soft text-amber" },
  steady: { label: "Steady", className: "bg-green-soft text-green" },
  low: { label: "Low energy", className: "bg-blue-soft text-blue" },
}

export function EnergyBadge({ level, className }: { level: EnergyLevel; className?: string }) {
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
