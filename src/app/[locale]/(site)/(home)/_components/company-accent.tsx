import { site } from '@/lib/site-data'
import type { CSSProperties, ReactNode } from 'react'

function getCompanyColor(company: string) {
  return site.recommendationCompanyColors[company]
}

// Ring around an avatar in the color of the author's company; with more than
// one company the ring is split into equal slices, one per company.
export function CompanyRing({
  companies,
  children,
}: {
  companies: string[]
  children: ReactNode
}) {
  const colors = companies.flatMap((company) => getCompanyColor(company) ?? [])
  if (colors.length === 0) {
    return children
  }
  const slice = 100 / colors.length
  const background =
    colors.length === 1
      ? colors[0]
      : `linear-gradient(135deg, ${colors
          .map(
            (color, index) =>
              `${color} ${index * slice}% ${(index + 1) * slice}%`
          )
          .join(', ')})`
  return (
    <span
      className="inline-flex shrink-0 rounded-full p-0.5"
      style={{ background }}
    >
      <span className="inline-flex rounded-full bg-background p-px">
        {children}
      </span>
    </span>
  )
}

function CompanyDot({ company }: { company: string }) {
  return (
    <span
      aria-hidden={true}
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: getCompanyColor(company) }}
    />
  )
}

// Company names, each with a dot in the company color.
export function CompanyLabel({ companies }: { companies: string[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2">
      {companies.map((company) => (
        <span key={company} className="inline-flex items-center gap-1">
          <CompanyDot company={company} />
          {company}
        </span>
      ))}
    </span>
  )
}

// Pill with the company color as a tinted border and background.
export function CompanyPill({ company }: { company: string }) {
  const color = getCompanyColor(company)
  const style: CSSProperties | undefined = color
    ? { borderColor: `${color}80`, backgroundColor: `${color}1A` }
    : undefined
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold"
      style={style}
    >
      <CompanyDot company={company} />
      {company}
    </span>
  )
}
