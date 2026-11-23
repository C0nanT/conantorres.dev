import type { Certification } from '@/lib/site-data'

export type CertificationSort = 'newest' | 'oldest' | 'title' | 'technologies'

export const certificationSorts: CertificationSort[] = [
  'newest',
  'oldest',
  'title',
  'technologies',
]

function getTechnologies(certification: Certification): string[] {
  return certification.technologies ?? []
}

export function getAllTechnologies(list: Certification[]): string[] {
  const unique = new Set(list.flatMap(getTechnologies))
  return [...unique].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

// A certification matches when it has at least one selected technology.
export function filterByTechnologies(
  list: Certification[],
  selected: string[]
): Certification[] {
  if (selected.length === 0) {
    return list
  }

  return list.filter((certification) =>
    getTechnologies(certification).some((tech) => selected.includes(tech))
  )
}

// issuedAt is YYYY-MM, so it compares as a string. Array#sort is stable, so
// ties keep the JSON order.
const comparators: Record<
  CertificationSort,
  (a: Certification, b: Certification) => number
> = {
  newest: (a, b) => b.issuedAt.localeCompare(a.issuedAt),
  oldest: (a, b) => a.issuedAt.localeCompare(b.issuedAt),
  title: (a, b) => a.title.localeCompare(b.title, 'pt-BR'),
  technologies: (a, b) =>
    getTechnologies(b).length - getTechnologies(a).length ||
    b.issuedAt.localeCompare(a.issuedAt),
}

export function sortCertifications(
  list: Certification[],
  sort: CertificationSort
): Certification[] {
  return [...list].sort(comparators[sort])
}

export interface CertificationYearGroup {
  year: string
  items: Certification[]
}

// Groups consecutive items by issue year; input order is preserved.
export function groupByYear(list: Certification[]): CertificationYearGroup[] {
  const groups: CertificationYearGroup[] = []

  for (const certification of list) {
    const year = certification.issuedAt.slice(0, 4)
    const last = groups.at(-1)

    if (last?.year === year) {
      last.items.push(certification)
    } else {
      groups.push({ year, items: [certification] })
    }
  }

  return groups
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: 'UTC',
})

// 'YYYY-MM' -> 'mai. 2026'
export function formatCertificationDate(issuedAt: string): string {
  const [year, month] = issuedAt.split('-').map(Number)
  if (!(year && month)) {
    return issuedAt
  }

  return `${monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)))} ${year}`
}

// 'Full Cycle' -> 'FC'; first letters of the first two words.
export function getIssuerInitials(issuer: string): string {
  return issuer
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export interface IssuerLogo {
  src: string
  // Transparent logos need breathing room; full-bleed ones fill the tile.
  padded?: boolean
}

const ISSUER_LOGOS = new Map<string, IssuerLogo>([
  ['Alura', { src: '/issuers/alura.png' }],
  ['Anthropic', { src: '/issuers/anthropic.png' }],
  ['Curso em Vídeo', { src: '/issuers/curso-em-video.png' }],
  [
    'Defensoria Pública do Estado do Rio Grande do Sul',
    { src: '/issuers/defensoria-rs.png', padded: true },
  ],
  ['EF SET', { src: '/issuers/ef-set.png' }],
  ['Full Cycle', { src: '/issuers/full-cycle.svg', padded: true }],
  ['Origamid', { src: '/issuers/origamid.png' }],
  [
    'Tribunal de Contas de Santa Catarina',
    { src: '/issuers/tce-sc.png', padded: true },
  ],
  ['UNIASSELVI', { src: '/issuers/uniasselvi.png' }],
])

export function getIssuerLogo(issuer: string): IssuerLogo | undefined {
  return ISSUER_LOGOS.get(issuer)
}
