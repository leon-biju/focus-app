import { useLayoutEffect, useRef } from "react"

const DURATION_MS = 280
const EASING = "cubic-bezier(.2,.7,.3,1)"

// FLIP: remember where every row sat, and once React has moved them, slide each one
// from its old spot to its new one. offsetTop (not getBoundingClientRect) so a scrolled
// list still measures right, and transforms don't feed back into the next measurement.
export function useFlipList() {
  const nodes = useRef(new Map<string, HTMLElement>())
  const refs = useRef(new Map<string, (node: HTMLElement | null) => void>())
  const tops = useRef(new Map<string, number>())

  // One stable callback per key, otherwise React detaches and reattaches every ref each render
  const register = (key: string) => {
    let ref = refs.current.get(key)
    if (!ref) {
      ref = (node: HTMLElement | null) => {
        if (node) nodes.current.set(key, node)
        else nodes.current.delete(key)
      }
      refs.current.set(key, ref)
    }
    return ref
  }

  // No dep array on purpose: measurements have to stay fresh through every render,
  // and a row only animates when it actually moved
  useLayoutEffect(() => {
    const previous = tops.current
    const next = new Map<string, number>()
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    for (const [key, node] of nodes.current) {
      const top = node.offsetTop
      next.set(key, top)

      const before = previous.get(key)
      // Rows that just appeared have nothing to slide from
      if (still || before === undefined || before === top) continue

      // A half-finished slide would otherwise fight the new one
      for (const animation of node.getAnimations()) animation.cancel()
      node.animate(
        [{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }],
        { duration: DURATION_MS, easing: EASING }
      )
    }

    tops.current = next
  })

  return register
}
