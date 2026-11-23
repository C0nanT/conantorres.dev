'use client'

import { CautionTape } from '@/components/common/caution-tape'
import { Switch } from '@/components/ui/switch'
import type { Experience } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import { CompanyAbout } from './company-about'
import { CompanyLogo } from './company-logo'

export function ExperienceItem({ job }: { job: Experience }) {
  const t = useTranslations('experience')
  const tMaintenance = useTranslations('maintenance')
  const switchId = useId()
  const [isDetailed, setIsDetailed] = useState(Boolean(job.detailedByDefault))
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
    <li className="group">
      {/* the rail is its own 2px line: it starts at the first dot's centre (no
          stub above it) and the last one fades out; the dot is centred on it
          and on the company row (min-h-7, centre at 14px) */}
      <div className="relative ml-2 pb-12 pl-6 group-last:pb-0 md:ml-0 md:pl-10">
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-0 w-0.5 bg-border group-first:top-3.5 group-last:bg-transparent group-last:bg-gradient-to-b group-last:from-border group-last:from-60% group-last:to-transparent"
        />
        <span
          aria-hidden="true"
          className="absolute top-[7px] -left-[6px] size-3.5 rounded-full border-2 border-primary bg-background transition-colors duration-200 group-first:bg-primary group-hover:bg-primary"
        />
        {/* company: logo (when there is one) + name, above the role */}
        <div className="mb-2 flex min-h-7 items-center gap-2.5">
          {job.logo && (
            <span className="relative flex-shrink-0">
              {/* optional glow behind the logo: the color at the centre,
                  fading to fully transparent at the circle's edge */}
              {job.logoGlow && (
                <span
                  aria-hidden="true"
                  className="absolute -inset-2.5"
                  style={{
                    background: `radial-gradient(circle closest-side, ${job.logoGlow}, transparent)`,
                  }}
                />
              )}
              <CompanyLogo logo={job.logo} />
            </span>
          )}
          <h3
            className="text-xl font-bold leading-tight"
            style={job.companyColor ? { color: job.companyColor } : undefined}
          >
            {job.company}
          </h3>
          <CompanyAbout job={job} />
        </div>
        {/* from sm the switch floats right beside the role; below sm the
            column is too narrow, so role / period / switch become a grid:
            the role takes the full width and the switch sits at the right
            end of the period's line */}
        <div className="mb-3 max-sm:grid max-sm:grid-cols-[1fr_auto] max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-0.5">
          <div className="relative z-10 float-right mb-2 ml-4 flex items-center gap-2 max-sm:col-start-2 max-sm:row-start-2 max-sm:float-none max-sm:mb-0 max-sm:ml-0">
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
          {/* role, level and period sit right of the dot, above the list */}
          <div className="space-y-0.5 max-sm:contents">
            <p className="font-semibold max-sm:col-span-2 max-sm:row-start-1">
              {job.role}
              {job.level && (
                <span className="ml-2 whitespace-nowrap text-sm font-medium text-primary">
                  [{job.level}]
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground max-sm:col-start-1 max-sm:row-start-2">
              {job.period}
            </p>
          </div>
        </div>
        <div className="relative clear-right">
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
    </li>
  )
}
