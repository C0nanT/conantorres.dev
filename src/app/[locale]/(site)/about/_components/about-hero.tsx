import { Badge } from '@/components/ui/badge'
import { getAge } from '@/lib/age'
import { site } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import { Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { getAboutIcon } from './about-icons'

const AGE_TOKEN = '{idade}'

// `**texto**` in the bio marks a highlighted keyword.
const HIGHLIGHT_PATTERN = /\*\*(.+?)\*\*/g

// A cursor image cannot read CSS variables, so the hover color (`--primary`
// in globals.css, light and dark) is repeated here: keep both in sync.
const CURSOR_COLORS = {
  light: { fill: 'hsl(14 48% 43%)', outline: '#fff' },
  dark: { fill: 'hsl(30 100% 69%)', outline: '#000' },
}

// A mouse cursor drawn from a text symbol (e.g. ♞) in the hover color; falls
// back to the default cursor where SVG cursors are not supported.
function symbolCursor(
  symbol: string,
  colors: { fill: string; outline: string }
) {
  // Ignore the text-presentation selector (U+FE0E) when counting characters.
  const length = [...symbol.replace('︎', '')].length
  const fontSize = length > 1 ? 14 : 28
  const y = length > 1 ? 21 : 27
  const text = symbol
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text x="16" y="${y}" font-size="${fontSize}" font-weight="700" text-anchor="middle" fill="${colors.fill}" stroke="${colors.outline}" stroke-width="1.5" paint-order="stroke">${text}</text></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, auto`
}

// The cursor for each theme goes into a CSS variable; the class picks one.
function symbolCursorStyle(symbol: string) {
  return {
    '--symbol-cursor': symbolCursor(symbol, CURSOR_COLORS.light),
    '--symbol-cursor-dark': symbolCursor(symbol, CURSOR_COLORS.dark),
  } as React.CSSProperties
}

const SYMBOL_CURSOR_CLASS =
  '[cursor:var(--symbol-cursor)] dark:[cursor:var(--symbol-cursor-dark)]'

function renderHighlights(text: string, symbols: Record<string, string>) {
  const nodes: React.ReactNode[] = []
  let cursor = 0
  for (const match of text.matchAll(HIGHLIGHT_PATTERN)) {
    const start = match.index ?? 0
    const keyword = match[1] ?? ''
    const symbol = symbols[keyword]
    if (start > cursor) {
      nodes.push(text.slice(cursor, start))
    }
    nodes.push(
      <strong
        key={start}
        className={cn(
          'relative font-semibold text-foreground transition-colors duration-200 hover:text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none',
          symbol && SYMBOL_CURSOR_CLASS
        )}
        style={symbol ? symbolCursorStyle(symbol) : undefined}
      >
        {keyword}
      </strong>
    )
    cursor = start + match[0].length
  }
  nodes.push(text.slice(cursor))
  return nodes
}

export async function AboutHero() {
  const t = await getTranslations('about')
  const { profile, about } = site
  const age = String(getAge(profile.birthDate, new Date()))
  const withAge = (text: string) => text.replaceAll(AGE_TOKEN, age)
  const headlineParts = about.headline.split(about.headlineHighlight)

  return (
    <section className="hero-section">
      <div className="max-w-6xl mx-auto px-4 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <Badge variant="outline" className="px-3 py-1 w-fit">
              <Users className="mr-1 h-3 w-3" />
              {about.badge}
            </Badge>

            {/* Main Content */}
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                {headlineParts[0]}
                <span className="gradient-text">{about.headlineHighlight}</span>
                {headlineParts[1]}
              </h1>

              <div className="text-xl text-muted-foreground">
                {about.subheadline}
              </div>

              <div className="prose prose-lg max-w-none text-muted-foreground">
                {about.bio.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="first-of-type:first-letter:float-left first-of-type:first-letter:mr-3 first-of-type:first-letter:text-6xl first-of-type:first-letter:font-bold first-of-type:first-letter:leading-[0.8] first-of-type:first-letter:text-primary"
                  >
                    {renderHighlights(
                      withAge(paragraph),
                      about.highlightSymbols
                    )}
                  </p>
                ))}
              </div>
            </div>

            {/* Hobbies */}
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">{t('hobbiesTitle')}</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {about.hobbies.map((hobby) => {
                  const Icon = getAboutIcon(hobby.icon)
                  return (
                    <li
                      key={hobby.label}
                      className="group flex items-center gap-2"
                    >
                      <Icon
                        aria-hidden="true"
                        className="h-4 w-4 flex-shrink-0 text-primary transition-transform duration-200 motion-safe:group-hover:scale-125"
                      />
                      <span className="text-sm">{hobby.label}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {/* Right Column - Image & Facts */}
          <div className="space-y-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="aspect-square w-full max-w-md mx-auto relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted">
                <Image
                  src={profile.images.avatar}
                  alt={t('photoAlt', { name: profile.displayName })}
                  fill={true}
                  priority={true}
                  sizes="(min-width: 1024px) 448px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Um dia comum */}
            <div className="space-y-5">
              <h2 className="font-semibold text-lg">{t('dayTitle')}</h2>
              <ol className="relative space-y-6 border-l-2 border-dashed border-border pl-8">
                {about.day.map((step) => {
                  const Icon = getAboutIcon(step.icon)
                  return (
                    <li key={step.title} className="group relative">
                      <span className="absolute -left-[3.05rem] flex h-9 w-9 items-center justify-center rounded-full border bg-background text-primary transition-[transform,background-color,border-color,color] duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground motion-safe:group-hover:scale-110 motion-reduce:transition-none">
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {step.time}
                      </div>
                      <div className="font-semibold transition-colors duration-200 group-hover:text-primary">
                        {step.title}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.text}
                      </p>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute right-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:right-[calc(50%-18rem)] lg:right-48 lg:top-[calc(50%-30rem)] xl:right-[calc(50%-24rem)]">
          <div
            className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-l from-muted/20 to-muted/10 opacity-20"
            style={{
              clipPath:
                'polygon(26.4% 48.3%, 8.3% 88.2%, 0% 53.6%, 2.6% 17.8%, 7.5% 15.1%, 24.3% 36%, 44.7% 52.5%, 53.5% 50.6%, 55% 37.1%, 49.7% 12.8%, 78.7% 35.9%, 99.9% 0%, 94.6% 48.9%, 78.6% 36.1%, 41.1% 99.8%, 26.4% 48.3%)',
            }}
          />
        </div>
      </div>
    </section>
  )
}
