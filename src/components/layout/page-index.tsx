'use client'

import { usePathname } from '@/lib/navigation'
import { cn } from '@/lib/styling'
import { useEffect, useState } from 'react'

type Item = { id: string; label: string }

// Matches the sticky header (h-16 + border) plus breathing room.
const HEADER_OFFSET = 80

// Sections opt in with `id` + `data-toc="Label"`. The list is read from the
// DOM after each route change (the route transition mounts the page late).
function useTocItems(pathname: string) {
  const [items, setItems] = useState<Item[]>([])
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname re-reads the DOM on navigation
  useEffect(() => {
    const read = () => {
      const found = [...document.querySelectorAll<HTMLElement>('[data-toc]')]
        .filter((el) => el.id)
        .map((el) => ({ id: el.id, label: el.dataset.toc ?? el.id }))
      setItems((prev) =>
        JSON.stringify(prev) === JSON.stringify(found) ? prev : found
      )
    }
    read()
    const timers = [300, 900].map((ms) => setTimeout(read, ms))
    return () => {
      for (const timer of timers) {
        clearTimeout(timer)
      }
    }
  }, [pathname])
  return items
}

// Active = last section whose top passed 35% of the viewport.
function useActiveIndex(items: Item[]) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.35
      let current = 0
      for (const [i, item] of items.entries()) {
        const top = document
          .getElementById(item.id)
          ?.getBoundingClientRect().top
        if (top !== undefined && top <= line) {
          current = i
        }
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(update)
      }
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [items])
  return active
}

function goTo(id: string) {
  const el = document.getElementById(id)
  if (!el) {
    return
  }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET,
    behavior: reduce ? 'auto' : 'smooth',
  })
}

// Desktop only (2xl+): below that the side gutter is too narrow for labels,
// and phones/tablets have no room for it.
export function PageIndex() {
  const pathname = usePathname()
  const items = useTocItems(pathname)
  const active = useActiveIndex(items)

  if (items.length < 2) {
    return null
  }

  return (
    <nav
      aria-label="Nesta página"
      className="-translate-y-1/2 fixed top-1/2 left-[47px] z-40 hidden w-44 2xl:block"
    >
      <p className="mb-3 pl-3 font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.2em]">
        Nesta página
      </p>
      <ul className="flex flex-col border-border border-l">
        {items.map((item, i) => (
          <li key={item.id} className="relative">
            <span
              className={cn(
                '-left-px absolute inset-y-1 w-0.5 rounded-full bg-primary transition-opacity duration-300 motion-reduce:transition-none',
                i === active ? 'opacity-100' : 'opacity-0'
              )}
            />
            <button
              type="button"
              onClick={() => goTo(item.id)}
              aria-current={i === active ? 'location' : undefined}
              className={cn(
                'flex w-full items-baseline gap-2 py-1.5 pl-3 text-left text-sm outline-none transition-colors duration-200 hover:text-foreground focus-visible:text-primary motion-reduce:transition-none',
                i === active
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
