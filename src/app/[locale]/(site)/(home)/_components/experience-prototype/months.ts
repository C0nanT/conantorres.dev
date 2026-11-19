// PROTOTYPE helper: "Mar 2026 - Atual" -> months, for proportional bars.
const MONTHS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function toIndex(text: string) {
  if (text.trim() === 'Atual') {
    const now = new Date()
    return now.getFullYear() * 12 + now.getMonth()
  }
  const [month = '', year = '0'] = text.trim().split(' ')
  return Number(year) * 12 + MONTHS.indexOf(month)
}

export function parsePeriod(period: string) {
  const [from = '', to = ''] = period.split(' - ')
  const start = toIndex(from)
  const end = toIndex(to)
  return { start, end, months: Math.max(1, end - start + 1) }
}

export function formatDuration(months: number) {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = []
  if (years) {
    parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`)
  }
  if (rest) {
    parts.push(`${rest} ${rest === 1 ? 'mês' : 'meses'}`)
  }
  return parts.join(' e ')
}
