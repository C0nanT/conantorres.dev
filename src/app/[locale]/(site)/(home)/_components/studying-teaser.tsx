import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'
import { site } from '@/lib/site-data'
import { ArrowUpRight } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

export async function StudyingTeaser() {
  const t = await getTranslations('studyingTeaser')
  const book = site.books.recommended.find(
    (item) => item.id === site.studying.book.id
  )

  return (
    <section id="estudando" data-toc="Estudando" className="scroll-mt-16 py-14">
      <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-4 max-sm:text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t('eyebrow')}
          </p>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="max-w-xl text-lg text-muted-foreground max-sm:mx-auto">
            {t('text')}
          </p>
          <Button asChild={true} variant="outline">
            <Link href="/about#como-estou-estudando">
              {t('button')}
              <ArrowUpRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {book?.cover && (
          <div className="relative mx-auto aspect-[3/4] w-28 rotate-3 overflow-hidden rounded-md border border-border/40 shadow-xl md:w-32">
            <Image
              src={book.cover}
              alt={book.title}
              fill={true}
              sizes="128px"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  )
}
