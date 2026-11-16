'use client'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Link } from '@/lib/navigation'
import { ArrowLeft, LogOut, Menu, Minus, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useState } from 'react'
import { logout } from '../actions'
import { SavePageForm } from './save-page-form'
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP, clamp } from './viewer-limits'

export function PdfToolbar({
  bookId,
  page,
  startPage,
  total,
  zoom,
  isSentenceCopyOn,
  onPageChange,
  onZoomChange,
  onSentenceCopyChange,
}: {
  bookId: string
  page: number
  startPage: number
  total: number
  zoom: number
  isSentenceCopyOn: boolean
  onPageChange: (page: number) => void
  onZoomChange: (zoom: number) => void
  onSentenceCopyChange: (isOn: boolean) => void
}) {
  const t = useTranslations('reader')
  const [draft, setDraft] = useState(String(page))

  useEffect(() => {
    setDraft(String(page))
  }, [page])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const target = Number.parseInt(draft, 10)
    if (Number.isNaN(target)) {
      setDraft(String(page))
      return
    }
    onPageChange(clamp(target, 1, total))
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b bg-background px-2 py-1.5">
      <Button asChild={true} variant="ghost" size="sm">
        <Link href="/books" aria-label={t('back')}>
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('back')}</span>
        </Link>
      </Button>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('previousPage')}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </Button>
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={total}
            value={draft}
            aria-label={t('goToPage')}
            onChange={(event) => setDraft(event.target.value)}
            className="h-8 w-14 rounded-md border bg-background px-1 text-center text-sm"
          />
          <span className="whitespace-nowrap text-muted-foreground text-sm">
            {t('pageOf', { total })}
          </span>
        </form>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('nextPage')}
          disabled={page >= total}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </Button>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <SavePageForm
          bookId={bookId}
          page={page}
          startPage={startPage}
          total={total}
        />
        <ZoomControls zoom={zoom} onZoomChange={onZoomChange} />
        <SentenceCopySwitch
          isOn={isSentenceCopyOn}
          onChange={onSentenceCopyChange}
        />
        <SignOutButton />
      </div>

      <Popover>
        <PopoverTrigger asChild={true}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label={t('menu')}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="flex w-auto max-w-[calc(100vw-1rem)] flex-col items-stretch gap-3 lg:hidden"
        >
          <SavePageForm
            bookId={bookId}
            page={page}
            startPage={startPage}
            total={total}
          />
          <ZoomControls zoom={zoom} onZoomChange={onZoomChange} />
          <SentenceCopySwitch
            isOn={isSentenceCopyOn}
            onChange={onSentenceCopyChange}
          />
          <SignOutButton isLabelVisible={true} />
        </PopoverContent>
      </Popover>
    </header>
  )
}

// Copy mode: the sentence under the pointer is highlighted, and a click
// copies it (use-sentence-copy.ts).
function SentenceCopySwitch({
  isOn,
  onChange,
}: {
  isOn: boolean
  onChange: (isOn: boolean) => void
}) {
  const t = useTranslations('reader.sentenceCopy')
  const id = useId()

  return (
    <div className="flex items-center gap-2" title={t('hint')}>
      <Switch id={id} checked={isOn} onCheckedChange={onChange} />
      <label htmlFor={id} className="cursor-pointer whitespace-nowrap text-sm">
        {t('label')}
      </label>
    </div>
  )
}

function ZoomControls({
  zoom,
  onZoomChange,
}: {
  zoom: number
  onZoomChange: (zoom: number) => void
}) {
  const t = useTranslations('reader')

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t('zoomOut')}
        disabled={zoom <= MIN_ZOOM}
        onClick={() => onZoomChange(zoom - ZOOM_STEP)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span
        className="w-12 text-center text-muted-foreground text-sm tabular-nums"
        title={t('zoomLevel', { percent: Math.round(zoom * 100) })}
      >
        {Math.round(zoom * 100)}%
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={t('zoomIn')}
        disabled={zoom >= MAX_ZOOM}
        onClick={() => onZoomChange(zoom + ZOOM_STEP)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

function SignOutButton({
  isLabelVisible = false,
}: { isLabelVisible?: boolean }) {
  const t = useTranslations('reader')

  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm" aria-label={t('signOut')}>
        <LogOut
          className={isLabelVisible ? 'mr-2 h-4 w-4' : 'h-4 w-4 sm:mr-2'}
        />
        <span className={isLabelVisible ? undefined : 'hidden sm:inline'}>
          {t('signOut')}
        </span>
      </Button>
    </form>
  )
}
