import type { RecommendationGroup } from '@/lib/recommendation-groups'
import { cn } from '@/lib/styling'
import { type PanInfo, motion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'
import { RecommendationAvatar } from './recommendation-avatar'
import { RecommendationCountdown } from './recommendation-countdown'

const SWIPE_THRESHOLD = 50
const SLIDE_GAP_PX = 12

interface RecommendationCarouselProps {
  items: RecommendationGroup[]
  selectedIndex: number
  countdownDelayMs: number
  countdownDurationMs: number
  onSelect: (index: number, direction: 1 | -1) => void
  onCountdownEnd: () => void
}

// Só mobile: o autor ativo no centro e os vizinhos (quem já passou à esquerda,
// quem vem à direita) espiando nas laterais. Arrastar ou tocar num vizinho
// troca; no desktop a lista vertical de abas continua.
export function RecommendationCarousel({
  items,
  selectedIndex,
  countdownDelayMs,
  countdownDurationMs,
  onSelect,
  onCountdownEnd,
}: RecommendationCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLButtonElement | null)[]>([])
  // null até medir: o primeiro posicionamento não anima
  const [offset, setOffset] = useState<number | null>(null)
  const last = items.length - 1

  // Os cards têm a largura do próprio conteúdo, então o deslocamento que
  // centraliza o ativo vem da medida real, refeita ao redimensionar.
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const slide = slideRefs.current[selectedIndex]
    if (!(viewport && slide)) {
      return
    }
    const center = () => {
      setOffset(
        viewport.clientWidth / 2 - (slide.offsetLeft + slide.offsetWidth / 2)
      )
    }
    center()
    const observer = new ResizeObserver(center)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [selectedIndex])
  const goNext = () =>
    onSelect(selectedIndex === last ? 0 : selectedIndex + 1, 1)
  const goPrevious = () =>
    onSelect(selectedIndex === 0 ? last : selectedIndex - 1, -1)

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x <= -SWIPE_THRESHOLD) {
      goNext()
    } else if (info.offset.x >= SWIPE_THRESHOLD) {
      goPrevious()
    }
  }

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Autores das recomendações"
      className="overflow-hidden md:hidden"
    >
      <motion.div
        ref={viewportRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        dragSnapToOrigin={true}
        onDragEnd={handleDragEnd}
        className="touch-pan-y"
      >
        <div
          style={{
            transform: `translateX(${offset ?? 0}px)`,
            gap: SLIDE_GAP_PX,
          }}
          className={cn(
            'flex w-max',
            offset !== null &&
              'transition-transform duration-300 ease-out motion-reduce:transition-none'
          )}
        >
          {items.map((item, index) => {
            const isSelected = index === selectedIndex
            const distance = Math.abs(index - selectedIndex)
            return (
              <button
                key={item.id}
                ref={(node) => {
                  slideRefs.current[index] = node
                }}
                type="button"
                tabIndex={distance === 1 ? 0 : -1}
                aria-hidden={distance > 1}
                aria-current={isSelected}
                aria-label={`${item.name}, ${item.company}`}
                onClick={() => {
                  if (!isSelected) {
                    onSelect(index, index > selectedIndex ? 1 : -1)
                  }
                }}
                className={cn(
                  'relative flex shrink-0 items-center gap-3 rounded-lg border bg-background px-3 py-2 text-left transition-[transform,opacity,border-color] duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                  isSelected
                    ? 'border-primary/40'
                    : 'scale-90 border-transparent opacity-50'
                )}
              >
                <RecommendationAvatar person={item} size="sm" />
                <span className="flex flex-col whitespace-nowrap">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.company}
                  </span>
                </span>
                {isSelected && items.length > 1 && (
                  <RecommendationCountdown
                    delayMs={countdownDelayMs}
                    durationMs={countdownDurationMs}
                    onEnd={onCountdownEnd}
                  />
                )}
              </button>
            )
          })}
        </div>
      </motion.div>
      <p
        aria-live="polite"
        className="mt-2 text-center text-xs text-muted-foreground"
      >
        {selectedIndex + 1} / {items.length}
      </p>
    </section>
  )
}
