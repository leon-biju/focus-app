import { useState } from "react"
import { ProgressRing } from "@/components/progress-ring"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useNoteComposer } from "@/hooks/use-notes"
import type { Note } from "@/lib/notes"

export function FocusModePage() {
  // "This session" is scoped to this visit: only what got parked since the page
  // mounted, newest first. Everything parked lands in the full list on /tasks.
  const [parked, setParked] = useState<Note[]>([])
  const composer = useNoteComposer((note) => setParked((prev) => [note, ...prev]))

  return (
    <div className="flex min-h-full box-border">
      <div className="flex flex-1 flex-col items-center justify-center px-10 py-15 text-center">
        <div className="text-[12.5px] font-semibold tracking-[.1em] text-primary uppercase">
          Focusing on
        </div>
        <h1 className="mt-3.5 max-w-[560px] text-balance font-heading text-4xl font-semibold tracking-tight">
          Draft Q3 project brief
        </h1>
        <div className="mt-2 text-[13.5px] text-muted-foreground">
          First micro-step: open the doc and write one ugly sentence.
        </div>

        <div className="mt-11">
          <ProgressRing size={240} stroke={10} fraction={0.6}>
            <div>
              <div className="font-mono text-5xl font-semibold tracking-tight">16:24</div>
              <div className="mt-0.5 text-xs text-muted-foreground">of 40 min · flexible</div>
            </div>
          </ProgressRing>
        </div>

        <div className="mt-9 flex gap-2.5">
          <Button variant="default" className="bg-foreground px-6.5 text-background hover:bg-foreground/90">
            Pause
          </Button>
          <Button variant="outline" className="px-5">
            +10 min
          </Button>
          <Button variant="outline" className="px-5">
            Done — mark complete
          </Button>
        </div>

        <div className="mt-7 flex items-center gap-2.5 rounded-full bg-green-soft px-4 py-2.5 text-[12.5px] text-muted-foreground">
          <span className="size-1.75 rounded-full bg-green" />
          Break in 24 min — stand up, water, no phone
        </div>
      </div>

      <aside className="flex w-75 flex-none flex-col border-l border-border px-6 py-7 box-border">
        <div className="text-[12.5px] font-semibold tracking-[.06em] text-muted-foreground uppercase">
          Parking lot
        </div>
        <div className="mt-1 text-xs leading-relaxed text-ink-3">
          Stray thought? Park it. It saves to your inbox — you don't have to hold it.
        </div>
        <Textarea
          rows={3}
          value={composer.draft}
          onChange={(e) => composer.setDraft(e.target.value)}
          onKeyDown={composer.onKeyDown}
          placeholder="e.g. reply to Sam about the offsite…"
          className="mt-3.5 resize-none text-[13px]"
        />
        <button
          disabled={!composer.canSubmit}
          onClick={composer.submit}
          className="mt-2.5 cursor-pointer rounded-lg bg-linesoft px-2.5 py-2.5 text-[12.5px] font-semibold text-muted-foreground hover:bg-accent-soft hover:text-primary disabled:cursor-default disabled:opacity-50 disabled:hover:bg-linesoft disabled:hover:text-muted-foreground"
        >
          {composer.isPending ? "Parking…" : "Park it → inbox"}
        </button>

        {parked.length > 0 && (
          <>
            <div className="mt-6.5 text-[11px] font-semibold tracking-[.06em] text-ink-3 uppercase">
              Parked this session
            </div>
            <div className="mt-2.5 flex flex-col gap-2">
              {parked.map((p) => (
                <div key={p.id} className="rounded-lg bg-linesoft px-3 py-2.5 text-[12.5px] text-muted-foreground">
                  {p.content}
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
