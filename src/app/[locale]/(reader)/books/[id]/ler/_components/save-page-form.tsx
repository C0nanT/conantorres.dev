'use client'

import { Button } from '@/components/ui/button'
import { parsePageNumber } from '@/lib/reader/page-number'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { savePage } from '../actions'

// "Parei na página [ ] Salvar". Prefilled with the page on screen and reset
// whenever it changes; the only way a position is ever saved (no autosave, no
// browser copy).
export function SavePageForm({
  bookId,
  page,
  startPage,
  total,
  onSaved,
}: {
  bookId: string
  page: number
  startPage: number
  total: number
  onSaved: (page: number) => void
}) {
  const t = useTranslations('reader.savePage')
  const inputId = useId()
  const [draft, setDraft] = useState(String(page))
  const [isInvalid, setIsInvalid] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isReady = total > 0

  useEffect(() => {
    setDraft(String(page))
    setIsInvalid(false)
  }, [page])

  const rejectInvalid = (limit: number) => {
    setIsInvalid(true)
    toast.error(t('invalid', { total: limit }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const target = parsePageNumber(draft, total)
    if (target === null) {
      rejectInvalid(total)
      return
    }

    startTransition(async () => {
      const result = await savePage(bookId, target, total)
      if (result.status === 'saved') {
        setIsInvalid(false)
        onSaved(result.page)
        toast.success(t('saved', { page: result.page }))
        return
      }
      if (result.status === 'invalid') {
        rejectInvalid(result.total)
        return
      }
      toast.error(t(result.status))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <span className="whitespace-nowrap text-muted-foreground text-sm tabular-nums">
        p{startPage} ·
      </span>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft}
        aria-label={t('label')}
        aria-invalid={isInvalid}
        disabled={!isReady}
        onChange={(event) => {
          setDraft(event.target.value)
          setIsInvalid(false)
        }}
        className="h-8 w-14 rounded-md border bg-background px-1 text-center text-sm aria-[invalid=true]:border-destructive"
      />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={!isReady || isPending}
      >
        {isPending ? t('saving') : t('submit')}
      </Button>
      <span className="whitespace-nowrap text-muted-foreground text-sm tabular-nums">
        · {Math.max(0, page - startPage)} páginas
      </span>
    </form>
  )
}
