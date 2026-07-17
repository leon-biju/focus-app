export function ToggleVisual({ on }: { on: boolean }) {
  return (
    <div
      className={`relative h-5.5 w-9.5 flex-none rounded-full ${on ? "bg-primary" : "bg-linesoft"}`}
    >
      <div
        className={`absolute top-0.5 size-4.5 rounded-full bg-white ${
          on ? "right-0.5" : "left-0.5 border border-line bg-card"
        }`}
      />
    </div>
  )
}
