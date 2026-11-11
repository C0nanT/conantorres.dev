import { site } from '@/lib/site-data'
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

// Company name with a dot in the company color, for a text heading.
export function CompanyPill({ company }: { company: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
      <CompanyDot company={company} />
      {company}
    </span>
  )
}
