'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion'
import { MousePointer2, Pointer } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

const WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=5548999904772'
const LOOP = {
  duration: 6,
  times: [0, 0.1, 0.5, 0.55, 0.65, 0.75, 0.95, 1],
  repeatDelay: 1,
  ease: 'easeInOut' as const,
  repeat: Number.POSITIVE_INFINITY,
}
// While the cursor travels left it dips down and comes back up, tracing an arc
// instead of a straight line. The height is derived from the horizontal
// position, so it only returns to the card's level as the cursor arrives.
const ARC_DIP = 40

export function AvailableBadge() {
  const t = useTranslations('hero')
  const isReducedMotion = useReducedMotion()
  const anchorRef = useRef<HTMLDivElement>(null)
  const [startX, setStartX] = useState(400)
  const cursorX = useMotionValue(startX)
  const cursorY = useTransform(cursorX, (x) => {
    const progress = Math.min(Math.max(x / startX, 0), 1)
    return ARC_DIP * 4 * progress * (1 - progress)
  })

  // Cursor starts just past the right edge of the viewport and travels to the
  // card's click point (its horizontal centre).
  useEffect(() => {
    const measure = () => {
      const rect = anchorRef.current?.getBoundingClientRect()
      const centerX = (rect?.left ?? 0) + (rect?.width ?? 0) / 2
      setStartX(window.innerWidth - centerX + 24)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute -bottom-3 -right-3 transition-transform duration-300 ease-out motion-safe:hover:scale-110"
    >
      <motion.div
        ref={anchorRef}
        className="relative"
        animate={
          isReducedMotion ? undefined : { scale: [1, 1, 1, 1, 0.94, 1, 1, 1] }
        }
        transition={LOOP}
      >
        <Card className="border-green-500/20 px-4 py-2.5 shadow-md shadow-green-500/20 transition-all duration-300 ease-out hover:border-green-500/50 hover:[box-shadow:0_8px_24px_-14px_rgb(34_197_94/0.55)]">
          <CardContent className="p-0">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
              <span className="text-sm font-medium leading-5">
                {t('cta.available')}
              </span>
            </div>
          </CardContent>
        </Card>

        {!isReducedMotion && (
          <>
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[60%] -ml-2 -mt-2 h-4 w-4 rounded-full bg-green-500/40"
              animate={{
                scale: [0.6, 0.6, 0.6, 0.6, 0.6, 2.4, 2.4, 2.4],
                opacity: [0, 0, 0, 0, 0.6, 0, 0, 0],
              }}
              transition={LOOP}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[60%] z-10 h-0 w-0 drop-shadow"
              style={{ x: cursorX, y: cursorY }}
              initial={{ x: startX, opacity: 0 }}
              animate={{
                x: [startX, startX, 0, 0, 0, 0, 0, 0],
                opacity: [0, 1, 1, 1, 1, 1, 0, 0],
                scale: [1, 1, 1, 1, 0.8, 1, 1, 1],
              }}
              transition={LOOP}
            >
              <motion.span
                className="absolute -left-0.5 -top-0.5"
                animate={{ opacity: [1, 1, 1, 0, 0, 0, 0, 0] }}
                transition={LOOP}
              >
                <MousePointer2 className="h-5 w-5 fill-foreground text-background" />
              </motion.span>
              <motion.span
                className="absolute -left-[7px] -top-px"
                animate={{ opacity: [0, 0, 0, 1, 1, 1, 1, 1] }}
                transition={LOOP}
              >
                <Pointer className="h-5 w-5 fill-background text-foreground" />
              </motion.span>
            </motion.div>
          </>
        )}
      </motion.div>
    </a>
  )
}
