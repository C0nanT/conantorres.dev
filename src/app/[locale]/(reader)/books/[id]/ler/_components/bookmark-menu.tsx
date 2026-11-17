'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Bookmark, BookmarkMinus, BookmarkPlus, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

// Toolbar entry for the ribbons: marks or unmarks the page on screen (the
// only way on touch screens) and lists every marked page to jump to it.
export function BookmarkMenu({
  page,
  total,
  pages,
  isPageMarked,
  onToggle,
  onGoTo,
}: {
  page: number
  total: number
  pages: number[]
  isPageMarked: boolean
  onToggle: (page: number) => void
  onGoTo: (page: number) => void
}) {
  const t = useTranslations('reader.bookmarks')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild={true}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('menu', { count: pages.length })}
          title={t('menu', { count: pages.length })}
          disabled={total === 0}
        >
          <Bookmark
            className={
              isPageMarked ? 'h-4 w-4 fill-blue-600 text-blue-600' : 'h-4 w-4'
            }
          />
          {pages.length > 0 && (
            <span className="ml-1 text-muted-foreground text-xs tabular-nums">
              {pages.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-64 p-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => onToggle(page)}
        >
          {isPageMarked ? (
            <BookmarkMinus className="mr-2 h-4 w-4" />
          ) : (
            <BookmarkPlus className="mr-2 h-4 w-4 text-blue-600" />
          )}
          {isPageMarked ? t('remove', { page }) : t('add', { page })}
        </Button>
        <p className="mt-3 mb-1 px-1 font-medium text-muted-foreground text-xs">
          {t('title')}
        </p>
        {pages.length === 0 ? (
          <p className="px-1 py-2 text-muted-foreground text-sm">
            {t('empty')}
          </p>
        ) : (
          <ul className="max-h-64 overflow-y-auto">
            {pages.map((marked) => (
              <li key={marked} className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start"
                  onClick={() => {
                    onGoTo(marked)
                    setIsOpen(false)
                  }}
                >
                  <Bookmark className="mr-2 h-4 w-4 fill-blue-600 text-blue-600" />
                  {t('page', { page: marked })}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={t('remove', { page: marked })}
                  title={t('remove', { page: marked })}
                  onClick={() => onToggle(marked)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
