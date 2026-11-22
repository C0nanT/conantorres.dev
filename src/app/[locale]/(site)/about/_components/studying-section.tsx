import { Button } from '@/components/ui/button'
import { Link } from '@/lib/navigation'
import { getBooks } from '@/lib/reader/book-progress'
import { site } from '@/lib/site-data'
import { ArrowUpRight, BookOpen, Github, Hammer } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'

export async function StudyingSection() {
  const t = await getTranslations('studying')
  const { topics, book: bookNote, project, news } = site.studying
  const book = getBooks().find((item) => item.id === bookNote.id)
  const progress = book?.progress ?? 0

  return (
    <section id="como-estou-estudando" className="scroll-mt-20 py-16 lg:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {t('titleLead')}{' '}
            <span className="gradient-text">{t('titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
          <ol className="space-y-2 border-l-2 border-border pl-4">
            {topics.map((topic, index) => (
              <li key={topic} className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-medium">{topic}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-14">
          {book && (
            <article className="grid grid-cols-[auto_1fr] gap-6">
              {book.cover && (
                <Link
                  href="/books"
                  className="relative block aspect-[3/4] w-28 overflow-hidden rounded-md border border-border/40 shadow-md sm:w-36"
                >
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill={true}
                    sizes="144px"
                    className="object-cover"
                  />
                </Link>
              )}
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
                  <BookOpen aria-hidden="true" className="h-4 w-4" />
                  {t('reading')}
                </p>
                <h3 className="text-2xl font-bold leading-tight">
                  {book.title}
                </h3>
                <p className="text-muted-foreground">{bookNote.note}</p>
                <div
                  aria-hidden="true"
                  className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="sr-only">
                  {progress}% {t('progress')}
                </p>
                <Link
                  href="/books"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t('viewBooks')}
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </article>
          )}

          <hr className="border-border" />

          <article className="space-y-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Hammer aria-hidden="true" className="h-4 w-4" />
              {t('building')} · {project.status}
            </p>
            <h3 className="font-mono text-3xl font-bold">{project.name}</h3>
            <p className="max-w-xl text-lg text-muted-foreground">
              {project.description}
            </p>
            <p className="max-w-xl border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
              {project.noAi}
            </p>
            <Button asChild={true} size="sm">
              <a href={project.url} target="_blank" rel="noopener noreferrer">
                <Github aria-hidden="true" className="mr-2 h-4 w-4" />
                {t('viewGithub')}
              </a>
            </Button>
          </article>

          <hr className="border-border" />

          <article className="space-y-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <svg aria-hidden="true" viewBox="0 0 28 20" className="h-3 w-4">
                <rect width="28" height="20" rx="5" fill="#FF0000" />
                <path d="M11 6l7 4-7 4z" fill="#fff" />
              </svg>
              {t('following')}
            </p>
            <p className="max-w-xl text-lg text-muted-foreground">{news}</p>
          </article>
        </div>
      </div>
    </section>
  )
}
