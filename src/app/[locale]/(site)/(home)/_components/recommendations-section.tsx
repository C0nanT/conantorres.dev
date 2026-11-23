'use client'

import { Badge } from '@/components/ui/badge'
import {
  type RecommendationGroup,
  groupRecommendations,
} from '@/lib/recommendation-groups'
import { site } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import {
  AnimatePresence,
  type Variants,
  motion,
  useReducedMotion,
} from 'framer-motion'
import { ExternalLink, Linkedin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type KeyboardEvent, useId, useRef, useState } from 'react'
import { CompanyLabel, CompanyPill } from './company-accent'
import { RecommendationAvatar } from './recommendation-avatar'
import { RecommendationCarousel } from './recommendation-carousel'
import { RecommendationCountdown } from './recommendation-countdown'
import { RecommendationWall } from './recommendation-wall'

// ~200 palavras/min: confortável para ler sem pressa
const READING_MS_PER_WORD = 300
const MIN_READING_MS = 6000
// a barra só aparece depois que o destaque termina de chegar no autor; o
// tempo de leitura total continua o mesmo, a contagem é que começa depois
const BAR_DELAY_MS = 500

// Agrupa por empresa (a da primeira recomendação), na ordem em que aparecem
// no site.json; mural, carrossel e troca automática seguem essa mesma ordem.
function sortByCompany(groups: RecommendationGroup[]) {
  const rank = new Map<string, number>()
  for (const group of groups) {
    const company = group.entries[0]?.company ?? ''
    if (!rank.has(company)) {
      rank.set(company, rank.size)
    }
  }
  return [...groups].sort(
    (a, b) =>
      (rank.get(a.entries[0]?.company ?? '') ?? 0) -
      (rank.get(b.entries[0]?.company ?? '') ?? 0)
  )
}

function allText(group: RecommendationGroup) {
  return group.entries.map((entry) => entry.text).join(' ')
}

function getReadingTimeMs(text: string) {
  const words = text.trim().split(/\s+/).length
  return Math.max(MIN_READING_MS, words * READING_MS_PER_WORD)
}

const PANEL_OFFSET = 16

// direction 1 = próximo (o texto "desce" na lista: sai por cima e o novo
// entra por baixo); -1 = anterior, o inverso. direction 0 = sem deslocamento.
const panelVariants: Variants = {
  enter: (direction: number) => ({ opacity: 0, y: direction * PANEL_OFFSET }),
  center: { opacity: 1, y: 0 },
  exit: (direction: number) => ({ opacity: 0, y: -direction * PANEL_OFFSET }),
}

// Quem recomendou de uma empresa só mostra empresa, data e relação aqui; com
// mais de uma, cada texto leva o próprio cabeçalho e o rodapé fica só com o autor.
function Meta({ group }: { group: RecommendationGroup }) {
  const [only] = group.entries
  const rest =
    group.entries.length === 1 && only
      ? [only.date, only.relationship].filter(Boolean).join(' · ')
      : ''
  return (
    <>
      <p className="font-bold">{group.name}</p>
      <p className="text-sm text-muted-foreground">{group.headline}</p>
      {only && group.entries.length === 1 && (
        <p className="text-xs text-muted-foreground">
          <CompanyLabel companies={[only.company]} />
          {rest && ` · ${rest}`}
        </p>
      )}
    </>
  )
}

export function RecommendationsSection() {
  const t = useTranslations('recommendations')
  const items = sortByCompany(groupRecommendations(site.recommendations))
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const isStill = useReducedMotion() ?? false
  const [selectedId, setSelectedId] = useState(items[0]?.id)
  const [direction, setDirection] = useState<1 | -1>(1)
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.id === selectedId)
  )
  const selected = items[selectedIndex]

  if (!selected) {
    return null
  }
  const selectedText = allText(selected)
  const isMulti = selected.entries.length > 1

  const selectPerson = (index: number, nextDirection: 1 | -1) => {
    const item = items[index]
    if (item) {
      setDirection(nextDirection)
      setSelectedId(item.id)
    }
  }

  const handleCountdownEnd = () => {
    selectPerson((selectedIndex + 1) % items.length, 1)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = items.length - 1
    let next: number
    let nextDirection: 1 | -1
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      next = selectedIndex === last ? 0 : selectedIndex + 1
      nextDirection = 1
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      next = selectedIndex === 0 ? last : selectedIndex - 1
      nextDirection = -1
    } else if (event.key === 'Home') {
      next = 0
      nextDirection = -1
    } else if (event.key === 'End') {
      next = last
      nextDirection = 1
    } else {
      return
    }
    event.preventDefault()
    selectPerson(next, nextDirection)
    tabRefs.current[next]?.focus()
  }

  return (
    <section
      id="recomendacoes"
      data-toc="Recomendações"
      className="scroll-mt-16 py-16 lg:py-20"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <Badge
            variant="outline"
            className="px-3 py-1 hover:border-border hover:bg-transparent"
          >
            <Linkedin className="mr-1 h-3 w-3" />
            {t('badge')}
          </Badge>
          <h2 className="text-3xl font-bold lg:text-4xl">
            {t('titlePrefix')}{' '}
            <span className="gradient-text">{t('titleHighlight')}</span>
          </h2>
          <a
            href={site.social.linkedin.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline decoration-transparent underline-offset-4 transition-colors duration-300 hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('viewAll')}
            <ExternalLink aria-hidden={true} className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="group grid gap-8 md:grid-cols-[260px_1fr] md:gap-12">
          <RecommendationCarousel
            items={items}
            selectedIndex={selectedIndex}
            onSelect={selectPerson}
          />
          <RecommendationWall
            items={items}
            selectedId={selected.id}
            baseId={baseId}
            isStill={isStill}
            tabRefs={tabRefs}
            onSelect={(index) =>
              selectPerson(index, index > selectedIndex ? 1 : -1)
            }
            onKeyDown={handleKeyDown}
          />
          <figure
            id={`${baseId}-panel`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${selected.id}`}
            className="relative md:self-center"
          >
            <span
              aria-hidden={true}
              className="absolute -top-6 -left-2 text-7xl font-serif text-primary/20"
            >
              “
            </span>
            <AnimatePresence
              mode="wait"
              initial={false}
              custom={isStill ? 0 : direction}
            >
              <motion.div
                key={selected.id}
                custom={isStill ? 0 : direction}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: isStill ? 0 : 0.2, ease: 'easeOut' }}
              >
                {selected.entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={cn(
                      index > 0 &&
                        'mt-8 border-t border-dashed border-border pt-8'
                    )}
                  >
                    {isMulti && (
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <CompanyPill company={entry.company} />
                        <span className="text-xs text-muted-foreground">
                          {[entry.relationship, entry.date]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </div>
                    )}
                    <blockquote
                      className={cn(
                        'whitespace-pre-line leading-relaxed',
                        isMulti
                          ? 'text-base max-sm:text-[15px] lg:text-lg'
                          : 'text-lg max-sm:text-base lg:text-xl'
                      )}
                    >
                      {entry.text}
                    </blockquote>
                  </div>
                ))}
                {items.length > 1 && (
                  <RecommendationCountdown
                    delayMs={BAR_DELAY_MS}
                    durationMs={getReadingTimeMs(selectedText) - BAR_DELAY_MS}
                    onEnd={handleCountdownEnd}
                  />
                )}
                <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  <RecommendationAvatar person={selected} />
                  <div>
                    <Meta group={selected} />
                  </div>
                </figcaption>
              </motion.div>
            </AnimatePresence>
          </figure>
        </div>
      </div>
    </section>
  )
}
