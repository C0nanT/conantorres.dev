'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { setBookmark } from '../actions'

// The pages marked with the blue ribbon. Starts from the server's list and
// toggles optimistically: the ribbon moves at once, and a failed save puts it
// back with a toast. The browser keeps no copy; the database is the source.
export function useBookmarks(bookId: string, initial: number[], total: number) {
  const t = useTranslations('reader.bookmarks')
  const [marked, setMarked] = useState<ReadonlySet<number>>(
    () => new Set(initial)
  )
  // Read inside the stable toggle without making it change on every update.
  const latest = useRef({ marked, total })
  latest.current = { marked, total }

  const update = useCallback((page: number, isMarked: boolean) => {
    setMarked((current) => {
      if (current.has(page) === isMarked) {
        return current
      }
      const next = new Set(current)
      if (isMarked) {
        next.add(page)
      } else {
        next.delete(page)
      }
      return next
    })
  }, [])

  const toggle = useCallback(
    (page: number) => {
      const { marked: current, total: pdfTotal } = latest.current
      const isMarked = !current.has(page)
      update(page, isMarked)
      setBookmark(bookId, page, pdfTotal, isMarked)
        .then((result) => {
          if (result.status === 'added' || result.status === 'removed') {
            return
          }
          update(page, !isMarked)
          toast.error(t(result.status))
        })
        .catch(() => {
          update(page, !isMarked)
          toast.error(t('error'))
        })
    },
    [bookId, t, update]
  )

  // A replaced, shorter PDF hides marks past its last page (they stay saved).
  const pages = [...marked]
    .filter((page) => total === 0 || page <= total)
    .sort((a, b) => a - b)

  return { marked, pages, toggle }
}
