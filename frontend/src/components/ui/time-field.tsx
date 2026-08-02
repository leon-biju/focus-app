import {
  TimeField as AriaTimeField,
  DateInput,
  DateSegment,
} from "react-aria-components"
import { Time, parseTime } from "@internationalized/date"

import { cn } from "@/lib/utils"

function TimeField({
  value,
  onChange,
  use24h = false,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  value: string
  onChange: (hhmm: string) => void
  use24h?: boolean
  className?: string
  "aria-label"?: string
  "aria-invalid"?: boolean
}) {
  const timeValue = value ? parseTime(value.length === 5 ? value + ":00" : value) : null

  return (
    <AriaTimeField
      aria-label={ariaLabel}
      hourCycle={use24h ? 24 : 12}
      value={timeValue}
      onChange={(t) => {
        if (!t) {
          return
        }
        const hh = String(t.hour).padStart(2, "0")
        const mm = String(t.minute).padStart(2, "0")
        onChange(`${hh}:${mm}`)
      }}
    >
      <DateInput
        data-invalid={ariaInvalid || undefined}
        className={cn(
          "flex w-full items-center rounded-lg border border-line bg-transparent px-3 py-2.25 font-mono text-[13px] shadow-none transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[invalid]:border-destructive data-[invalid]:ring-3 data-[invalid]:ring-destructive/20",
          className,
        )}
      >
        {(segment) => (
          <DateSegment
            segment={segment}
            className="rounded px-0.5 tabular-nums outline-none focus:bg-primary focus:text-primary-foreground data-[placeholder]:text-muted-foreground"
          />
        )}
      </DateInput>
    </AriaTimeField>
  )
}

export { TimeField, Time }
