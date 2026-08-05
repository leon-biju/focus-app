import { useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { addDays, isSameDay } from "@/features/time-blocker/api"

export function DayNav({
  date,
  summary,
  onChange,
  onAddBlock,
}: {
  date: Date
  summary: string
  onChange: (date: Date) => void
  onAddBlock: () => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const onToday = isSameDay(date, new Date())

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {/* The date is the heading and the picker trigger both */}
        <h1 className="font-heading text-[22px] font-semibold tracking-tight">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                aria-label="Pick a date"
                className="group flex cursor-pointer items-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {date.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                <ChevronDown
                  className="size-4 text-ink-3 transition-colors group-hover:text-ink"
                  strokeWidth={1.8}
                />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                defaultMonth={date}
                onSelect={(next) => {
                  if (!next) return
                  onChange(next)
                  setPickerOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{summary}</p>
      </div>

      <div className="flex flex-none items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous day"
          onClick={() => onChange(addDays(date, -1))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={onToday}
          onClick={() => onChange(new Date())}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next day"
          onClick={() => onChange(addDays(date, 1))}
        >
          <ChevronRight />
        </Button>
        {/* The way in for anything the gaps don't cover — a past day, or a slot
            that needs times typed rather than fitted */}
        <Button size="sm" onClick={onAddBlock} className="ml-1">
          <Plus />
          New block
        </Button>
      </div>
    </div>
  )
}
