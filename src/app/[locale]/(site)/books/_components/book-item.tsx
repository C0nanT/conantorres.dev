import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'
import { type RecommendedBook, getBookProgress } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import { BookOpen, ExternalLink, Star } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import Image from 'next/image'
import { ReadingBadge } from './reading-badge'

const COVER_SIZES = '144px'

// Grayscale cover underneath; the coloured copy is revealed from the bottom
// up as `progress` grows (0 = fully grey, 100 = fully coloured).
function CoverArt({
  book,
  progress,
}: { book: RecommendedBook; progress: number }) {
  if (!book.cover) {
    return (
      <div
        aria-hidden={true}
        className={cn(
          'flex h-48 w-36 flex-col justify-end rounded-md border border-border/40 bg-muted p-3 shadow-inner',
          book.status === 'to-read' && 'opacity-50'
        )}
      >
        <span className="line-clamp-3 text-sm font-bold leading-tight text-muted-foreground">
          {book.title}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative aspect-[3/4] w-36 overflow-hidden rounded-md border border-border/40 shadow-md transition-[transform,box-shadow] duration-300 ease-out motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:-rotate-1 group-hover:shadow-xl',
        book.status === 'to-read' && 'opacity-50'
      )}
    >
      <Image
        src={book.cover}
        alt={book.title}
        fill={true}
        sizes={COVER_SIZES}
        className={cn(
          'object-cover grayscale',
          book.status === 'reading' && 'opacity-50'
        )}
      />
      <Image
        src={book.cover}
        alt=""
        aria-hidden={true}
        fill={true}
        sizes={COVER_SIZES}
        className="object-cover"
        style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }}
      />
      {progress > 0 && progress < 100 && (
        <div
          aria-hidden={true}
          className="absolute inset-x-0 border-t-2 border-dotted border-black/40"
          style={{ top: `${100 - progress}%` }}
        />
      )}
    </div>
  )
}

// CSS-only tooltip (no tooltip lib in the project); the text is decorative
// because the reading progress is already announced to screen readers.
function BookCover({
  book,
  progress,
}: { book: RecommendedBook; progress: number | undefined }) {
  const t = useTranslations('books')
  const format = useFormatter()
  const updatedAt = book.progressUpdatedAt
    ? format.dateTime(new Date(book.progressUpdatedAt), {
        dateStyle: 'medium',
        timeZone: 'UTC',
      })
    : undefined

  return (
    <div className="group relative h-fit w-36">
      <CoverArt book={book} progress={progress ?? 0} />
      {progress !== undefined && (
        <span
          aria-hidden={true}
          className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-center text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 motion-reduce:transition-none"
        >
          {t('readPercent', { progress })}
          {updatedAt && (
            <span className="block text-[10px] font-normal opacity-70">
              {t('updatedAt', { date: updatedAt })}
            </span>
          )}
        </span>
      )}
    </div>
  )
}

function BookRating({ rating = 0 }: { rating?: number }) {
  const t = useTranslations('books')

  return (
    <div
      role="img"
      aria-label={rating ? t('ratingLabel', { rating }) : t('unrated')}
      className="group relative flex"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden={true}
          className={cn(
            'h-4 w-4',
            star <= rating
              ? 'fill-primary text-primary'
              : 'text-muted-foreground/40'
          )}
        />
      ))}
      {!rating && (
        <span
          aria-hidden={true}
          className="pointer-events-none absolute -top-9 left-0 z-10 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 motion-reduce:transition-none"
        >
          {t('unratedHint')}
        </span>
      )}
    </div>
  )
}

export function BookItem({ book }: { book: RecommendedBook }) {
  const t = useTranslations('books')
  const progress = getBookProgress(book)

  return (
    <article className="grid gap-5 py-10 first:pt-0last:pb-0 sm:grid-cols-[144px_1fr]">
      <BookCover book={book} progress={progress} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold">{book.title}</h3>
          {book.status === 'reading' ? (
            <ReadingBadge label={t('status.reading')} />
          ) : (
            <Badge variant="outline">{t(`status.${book.status}`)}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {book.authors.join(', ')} · {book.category}
        </p>
        <p className="text-muted-foreground">{book.description}</p>
        {book.note && (
          <p className="border-l-2 border-dotted border-primary pl-3 text-sm italic">
            {book.note}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {book.topics.map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <BookRating rating={book.rating} />
          {book.status === 'reading' && book.progress !== undefined && (
            <span className="sr-only">
              {t('progressLabel', { progress: book.progress })}
            </span>
          )}
          <Button asChild={true} size="sm" className="w-fit">
            <a href={book.url} target="_blank" rel="noopener noreferrer">
              {t('viewOnAmazon')}
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
          {book.readable && (
            <Button asChild={true} size="sm" variant="ghost" className="w-fit">
              <Link href={`/books/${book.id}/ler`}>
                <BookOpen className="mr-2 h-3.5 w-3.5" />
                {t('read')}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
