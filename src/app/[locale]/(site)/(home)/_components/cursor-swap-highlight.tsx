'use client'

import Image from 'next/image'
import { type MouseEvent, useEffect, useRef } from 'react'

const ICON_SIZE = 16
const CURSOR_SIZE = 24
const FULL_SCALE = CURSOR_SIZE / ICON_SIZE
// Flight time grows with distance, within these bounds.
const MIN_FLIGHT_MS = 300
const MAX_FLIGHT_MS = 550
const MS_PER_PX = 2

interface Point {
  x: number
  y: number
}

// idle: icon in place, normal cursor. flying: pointer hidden, icon moving to
// it. docked: icon hidden, the cursor is the icon. returning: normal cursor,
// icon flying back to its place.
type Phase = 'idle' | 'flying' | 'docked' | 'returning'

interface Flight {
  from: Point
  fromScale: number
  startedAt: number
  durationMs: number
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function flightDuration(from: Point, to: Point) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  return Math.min(MAX_FLIGHT_MS, Math.max(MIN_FLIGHT_MS, distance * MS_PER_PX))
}

/**
 * A hero highlight whose icon "turns into" the mouse cursor on hover: the
 * pointer hides, the icon glides to it and grows to cursor size, then the
 * cursor becomes the icon. On leave the icon glides back to its place.
 * Animated frame by frame (transform and opacity only), so the icon keeps
 * following the pointer smoothly while it moves.
 */
export function CursorSwapHighlight({
  label,
  image,
}: {
  label: string
  image: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLImageElement>(null)
  const phase = useRef<Phase>('idle')
  const position = useRef<Point>({ x: 0, y: 0 })
  const scale = useRef(1)
  const pointer = useRef<Point>({ x: 0, y: 0 })
  const flight = useRef<Flight | null>(null)
  const frame = useRef<number | undefined>(undefined)

  useEffect(() => () => cancelAnimationFrame(frame.current ?? 0), [])

  const dockedCursor = `url("${image}") ${CURSOR_SIZE / 2} ${CURSOR_SIZE / 2}, auto`

  function paint(opacity: number) {
    const icon = iconRef.current
    if (!icon) {
      return
    }
    const { x, y } = position.current
    icon.style.transform =
      x === 0 && y === 0 && scale.current === 1
        ? ''
        : `translate(${x}px, ${y}px) scale(${scale.current})`
    icon.style.opacity = String(opacity)
  }

  function setCursor(cursor: string) {
    if (rootRef.current) {
      rootRef.current.style.cursor = cursor
    }
  }

  // Pointer position relative to the icon's resting centre.
  function offsetFrom(event: MouseEvent): Point {
    const root = rootRef.current
    const icon = iconRef.current
    if (!(root && icon)) {
      return { x: 0, y: 0 }
    }
    const rootRect = root.getBoundingClientRect()
    const restX = rootRect.left + icon.offsetLeft + icon.offsetWidth / 2
    const restY = rootRect.top + icon.offsetTop + icon.offsetHeight / 2
    return { x: event.clientX - restX, y: event.clientY - restY }
  }

  function startFlight(target: Point, nextPhase: Phase) {
    phase.current = nextPhase
    flight.current = {
      from: { ...position.current },
      fromScale: scale.current,
      startedAt: performance.now(),
      durationMs: flightDuration(position.current, target),
    }
    cancelAnimationFrame(frame.current ?? 0)
    frame.current = requestAnimationFrame(step)
  }

  function step(now: number) {
    const current = flight.current
    if (!current) {
      return
    }
    const isFlying = phase.current === 'flying'
    // Flying aims at the live pointer, so it keeps following it.
    const target = isFlying ? pointer.current : { x: 0, y: 0 }
    const targetScale = isFlying ? FULL_SCALE : 1
    const t = Math.min(1, (now - current.startedAt) / current.durationMs)
    const eased = easeInOutCubic(t)
    position.current = {
      x: current.from.x + (target.x - current.from.x) * eased,
      y: current.from.y + (target.y - current.from.y) * eased,
    }
    scale.current =
      current.fromScale + (targetScale - current.fromScale) * eased

    if (t < 1) {
      paint(1)
      frame.current = requestAnimationFrame(step)
      return
    }
    flight.current = null
    if (isFlying) {
      phase.current = 'docked'
      paint(0)
      setCursor(dockedCursor)
      return
    }
    phase.current = 'idle'
    position.current = { x: 0, y: 0 }
    paint(1)
  }

  function handleMouseEnter(event: MouseEvent) {
    pointer.current = offsetFrom(event)
    if (prefersReducedMotion()) {
      phase.current = 'docked'
      paint(0)
      setCursor(dockedCursor)
      return
    }
    setCursor('none')
    startFlight(pointer.current, 'flying')
  }

  function handleMouseMove(event: MouseEvent) {
    pointer.current = offsetFrom(event)
    if (phase.current === 'docked') {
      // Keep the hidden icon under the pointer, ready for the way back.
      position.current = pointer.current
    }
  }

  function handleMouseLeave(event: MouseEvent) {
    const lastPointer = offsetFrom(event)
    setCursor('')
    if (prefersReducedMotion()) {
      cancelAnimationFrame(frame.current ?? 0)
      flight.current = null
      phase.current = 'idle'
      position.current = { x: 0, y: 0 }
      scale.current = 1
      paint(1)
      return
    }
    if (phase.current === 'docked') {
      // Reappear where the cursor left, then glide home.
      position.current = lastPointer
      scale.current = FULL_SCALE
    }
    startFlight({ x: 0, y: 0 }, 'returning')
  }

  return (
    <div
      ref={rootRef}
      className="relative flex items-center gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        ref={iconRef}
        src={image}
        alt=""
        width={ICON_SIZE}
        height={ICON_SIZE}
        className="pointer-events-none relative z-10 shrink-0 will-change-transform"
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
