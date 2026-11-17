'use client'

import { cn } from '@/lib/styling'
import { useTranslations } from 'next-intl'

// The blue ribbon hanging from a page's top edge. Marked: fully down.
// Unmarked: hidden above the edge, peeking out while the pointer is over the
// page (or the button has focus), so a click marks it. Touch screens use the
// toolbar's bookmark menu instead.
export function BookmarkRibbon({
  pageNumber,
  isMarked,
  onToggle,
}: {
  pageNumber: number
  isMarked: boolean
  onToggle: (pageNumber: number) => void
}) {
  const t = useTranslations('reader.bookmarks')

  return (
    <button
      type="button"
      aria-pressed={isMarked}
      aria-label={
        isMarked
          ? t('remove', { page: pageNumber })
          : t('add', { page: pageNumber })
      }
      title={
        isMarked
          ? t('remove', { page: pageNumber })
          : t('add', { page: pageNumber })
      }
      onClick={() => onToggle(pageNumber)}
      // Without hover the unmarked ribbon is invisible: a stray tap in the
      // corner must not mark the page.
      className={cn(
        'group/ribbon absolute top-0 right-6 z-[4] h-12 w-7 cursor-pointer overflow-hidden focus-visible:outline-none',
        !isMarked && '[@media(hover:none)]:pointer-events-none'
      )}
    >
      <span
        aria-hidden={true}
        className={cn(
          'block h-full w-full bg-blue-600 drop-shadow-sm [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)] motion-safe:transition-[transform,opacity] motion-safe:duration-200',
          isMarked
            ? 'translate-y-0 opacity-100 group-hover/ribbon:bg-blue-700'
            : '-translate-y-full opacity-0 group-hover/page:-translate-y-[55%] group-hover/page:opacity-40 group-hover/ribbon:-translate-y-[35%] group-hover/ribbon:opacity-70 group-focus-visible/ribbon:-translate-y-[35%] group-focus-visible/ribbon:opacity-70'
        )}
      />
    </button>
  )
}
