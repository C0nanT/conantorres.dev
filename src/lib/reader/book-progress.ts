import { type RecommendedBook, site } from '@/lib/site-data'
import { revalidatePath } from 'next/cache'
import { OWNER } from './access'
import { logReaderDbFailure } from './db'
import { listReadingPositions } from './reading-position'

// The one place where the public reading progress is decided. A readable
// book with a saved page takes `current_page / total_pages` and the save date
// from the database; every other book keeps `progress` / `progressUpdatedAt`
// from data/site. Components read the books from here and never merge.

interface SavedProgress {
  progress: number
  /** Day of the save in São Paulo, YYYY-MM-DD like data/site's dates */
  updatedAt: string
}

const SAVE_DAY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// The database stores the save as a UTC instant; the public page shows a
// plain day (data/site's `2026-10-12`, rendered as UTC). Turning the instant
// into São Paulo's calendar day here keeps a 22:30 save on the same day.
function toSaoPauloDay(instant: string): string | null {
  const date = new Date(instant)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  const parts = new Map(
    SAVE_DAY_FORMAT.formatToParts(date).map((part) => [part.type, part.value])
  )
  return `${parts.get('year')}-${parts.get('month')}-${parts.get('day')}`
}

function readSavedProgress(): Record<string, SavedProgress> {
  // The build has no data volume: skip the database and use data/site.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return {}
  }
  try {
    const saved: Record<string, SavedProgress> = {}
    for (const position of listReadingPositions(OWNER)) {
      const { currentPage, totalPages, updatedAt } = position
      const day = updatedAt === null ? null : toSaoPauloDay(updatedAt)
      if (currentPage === null || day === null || !totalPages) {
        continue
      }
      saved[position.bookId] = {
        progress: Math.min(100, Math.round((currentPage / totalPages) * 100)),
        updatedAt: day,
      }
    }
    return saved
  } catch (error) {
    logReaderDbFailure('ler-progresso', error)
    return {}
  }
}

export function getBooks(): RecommendedBook[] {
  const saved = readSavedProgress()
  return site.books.recommended.map((book) => {
    const fromDb = book.readable ? saved[book.id] : undefined
    return fromDb
      ? {
          ...book,
          progress: fromDb.progress,
          progressUpdatedAt: fromDb.updatedAt,
        }
      : book
  })
}

// Call after a page is saved. The books page renders per request (it reads
// the database), so this mainly drops any cached copy of it, including the
// client router cache; add every other page that shows book progress here.
export function revalidateBookProgress() {
  revalidatePath('/books')
  revalidatePath('/about')
}
