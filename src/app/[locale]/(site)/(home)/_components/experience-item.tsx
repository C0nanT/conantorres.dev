'use client'

import { CautionTape } from '@/components/common/caution-tape'
import { Switch } from '@/components/ui/switch'
import type { Experience } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'

export function ExperienceItem({ job }: { job: Experience }) {
  const t = useTranslations('experience')
  const tMaintenance = useTranslations('maintenance')
  const switchId = useId()
  const [isDetailed, setIsDetailed] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  // the list's natural height; the wrapper animates to it, so the items
  // below move down while the new text appears instead of jumping first
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto')
  const hasDetails = Boolean(job.details?.length)
  // details not written yet: keep the highlights, faded under the tape
  const isUnderMaintenance = isDetailed && !hasDetails
  const items = isDetailed && job.details?.length ? job.details : job.highlights

  useEffect(() => {
    const content = contentRef.current
    if (!content) {
      return
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setContentHeight(entry.contentRect.height)
      }
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="group grid gap-4 px-3 transition-colors duration-200 py-8 md:grid-cols-[280px_1fr] md:gap-12 hover:bg-muted/40">
      <div className="space-y-1">
        <h3 className="text-xl font-bold">
          {job.company}{' '}
          <span className="text-sm font-medium text-primary">
            [{job.level}]
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">{job.role}</p>
        <p className="text-sm text-muted-foreground">{job.period}</p>
      </div>
      <div>
        <div className="relative z-10 float-right mb-2 ml-4 flex items-center gap-2">
          <Switch
            id={switchId}
            checked={isDetailed}
            onCheckedChange={setIsDetailed}
          />
          <label
            htmlFor={switchId}
            className="cursor-pointer font-serif text-xs italic text-muted-foreground"
          >
            {t('moreDetails')}
          </label>
        </div>
        <div className="relative">
          {/* overflow-clip, not hidden: hidden would start a new block
              formatting context and stop the list wrapping around the switch */}
          <motion.div
            className="overflow-clip"
            animate={{ height: contentHeight }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.45,
              ease: 'easeOut',
            }}
          >
            <div ref={contentRef}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.ul
                  key={isDetailed ? 'details' : 'highlights'}
                  className={cn(
                    'space-y-2 text-muted-foreground transition-[opacity,filter] duration-300 motion-reduce:transition-none',
                    isUnderMaintenance && 'select-none opacity-30 blur-[1.5px]'
                  )}
                  aria-hidden={isUnderMaintenance}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: shouldReduceMotion ? 0 : 0.04,
                      },
                    },
                    exit: {
                      opacity: 0,
                      transition: { duration: shouldReduceMotion ? 0 : 0.15 },
                    },
                  }}
                >
                  {items.map((item) => (
                    <motion.li
                      key={item}
                      className="relative pl-5"
                      variants={{
                        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: shouldReduceMotion ? 0 : 0.25,
                            ease: 'easeOut',
                          },
                        },
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute left-0 text-primary"
                      >
                        ▸
                      </span>
                      {item}
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>
          </motion.div>
          {isUnderMaintenance && (
            <CautionTape
              label={tMaintenance('tape')}
              repeat={8}
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-2 overflow-hidden"
            />
          )}
        </div>
      </div>
    </div>
  )
}
