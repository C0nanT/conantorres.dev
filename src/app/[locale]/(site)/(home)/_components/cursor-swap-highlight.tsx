'use client'

import { cn } from '@/lib/styling'
import Image from 'next/image'
import { type MouseEvent, useEffect, useRef, useState } from 'react'

// How long the icon takes to fly to the pointer before it becomes the cursor.
const FLIGHT_MS = 250
const ICON_SIZE = 16
const CURSOR_SIZE = 24

// idle: icon in place, normal cursor. flying: pointer hidden, icon moving to
// it. docked: icon hidden, the cursor is the icon.
type Phase = 'idle' | 'flying' | 'docked'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * A hero highlight whose icon "turns into" the mouse cursor on hover: the
 * pointer hides, the icon flies to it and grows to cursor size, then the
 * cursor becomes the icon. On leave the icon flies back to its place.
 */
export function CursorSwapHighlight({
  label,
  image,
}: {
  label: string
  image: string
}) {
  const iconRef = useRef<HTMLImageElement>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const [phase, setPhase] = useState<Phase>('idle')
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  function aimAt(event: MouseEvent) {
    const rect = iconRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }
    setOffset({
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2),
    })
  }

  function handleMouseEnter(event: MouseEvent) {
    window.clearTimeout(timerRef.current)
    if (prefersReducedMotion()) {
      setPhase('docked')
      return
    }
    aimAt(event)
    setPhase('flying')
    timerRef.current = window.setTimeout(() => setPhase('docked'), FLIGHT_MS)
  }

  function handleMouseMove(event: MouseEvent) {
    if (phase === 'flying') {
      aimAt(event)
    }
  }

  function handleMouseLeave() {
    window.clearTimeout(timerRef.current)
    setPhase('idle')
    setOffset({ x: 0, y: 0 })
  }

  const isAway = phase !== 'idle'
  const cursorByPhase: Record<Phase, string | undefined> = {
    idle: undefined,
    flying: 'none',
    docked: `url("${image}") ${CURSOR_SIZE / 2} ${CURSOR_SIZE / 2}, auto`,
  }

  return (
    <div
      className="flex items-center gap-2"
      style={{ cursor: cursorByPhase[phase] }}
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
        className={cn(
          'pointer-events-none relative z-10 shrink-0 ease-out transition-transform',
          phase === 'docked' && 'opacity-0'
        )}
        style={{
          transitionDuration: `${FLIGHT_MS}ms`,
          transform: isAway
            ? `translate(${offset.x}px, ${offset.y}px) scale(${CURSOR_SIZE / ICON_SIZE})`
            : undefined,
        }}
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
