import type { RecommendationGroup } from '@/lib/recommendation-groups'
import { cn } from '@/lib/styling'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import type { KeyboardEvent } from 'react'
import { CompanyPill } from './company-accent'
import { RecommendationAvatar } from './recommendation-avatar'

interface RecommendationWallProps {
  items: RecommendationGroup[]
  selectedId: string
  baseId: string
  isStill: boolean
  tabRefs: { current: (HTMLButtonElement | null)[] }
  onSelect: (index: number) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

// Quem recomendou de mais de uma empresa fica na primeira. `items` já vem
// ordenado por empresa, então os índices de cada bloco são os globais.
function groupByCompany(items: RecommendationGroup[]) {
  const byCompany = new Map<
    string,
    { item: RecommendationGroup; index: number }[]
  >()
  items.forEach((item, index) => {
    const company = item.entries[0]?.company ?? ''
    byCompany.set(company, [...(byCompany.get(company) ?? []), { item, index }])
  })
  return [...byCompany].map(([company, members]) => ({ company, members }))
}

// Só desktop (no mobile o carrossel cobre): todos os autores de uma vez como
// um mural de rostos, para passar a ideia de quantidade sem ocupar uma linha
// por pessoa. O ativo ganha um anel.
export function RecommendationWall({
  items,
  selectedId,
  baseId,
  isStill,
  tabRefs,
  onSelect,
  onKeyDown,
}: RecommendationWallProps) {
  const t = useTranslations('recommendations')
  const companyGroups = groupByCompany(items)

  return (
    <div className="hidden md:block">
      <p className="mb-3 text-sm text-muted-foreground">
        {t('peopleCount', { count: items.length })}
      </p>
      <div
        role="tablist"
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className="space-y-4"
      >
        {companyGroups.map(({ company, members }) => (
          <div key={company} className="space-y-2">
            <p className="text-muted-foreground">
              <CompanyPill company={company} />
            </p>
            <div className="relative flex flex-wrap gap-1.5">
              {members.map(({ item, index }) => {
                const isSelected = item.id === selectedId
                return (
                  <button
                    key={item.id}
                    ref={(node) => {
                      tabRefs.current[index] = node
                    }}
                    id={`${baseId}-tab-${item.id}`}
                    type="button"
                    role="tab"
                    title={item.name}
                    aria-label={item.name}
                    aria-selected={isSelected}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => onSelect(index)}
                    className={cn(
                      'relative flex rounded-full transition-[opacity,filter] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      !isSelected &&
                        'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                    )}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId={`${baseId}-active`}
                        aria-hidden={true}
                        transition={
                          isStill
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 380, damping: 34 }
                        }
                        className="absolute -inset-[3px] rounded-full ring-2 ring-primary"
                      />
                    )}
                    <RecommendationAvatar person={item} size="sm" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
