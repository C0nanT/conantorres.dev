import { site } from '@/lib/site-data'
import type { CSSProperties } from 'react'

function getCompanyColor(company: string) {
  return site.recommendationCompanyColors[company]
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
