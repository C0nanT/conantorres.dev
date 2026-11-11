import { HighlightedText } from '@/components/common/highlighted-text'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getAge } from '@/lib/age'
import { site } from '@/lib/site-data'
import { Users } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { getAboutIcon } from './about-icons'

const AGE_TOKEN = '{idade}'

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
                  <p key={paragraph}>
                    <HighlightedText text={withAge(paragraph)} />
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

            {/* Quick Facts */}
            <div className="space-y-4">
              {about.facts.map((fact) => {
                const Icon = getAboutIcon(fact.icon)
                return (
                  <Card key={fact.label} className="tech-card group">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0 transition-[transform,background-color] duration-300 group-hover:bg-primary/20 motion-safe:group-hover:rotate-6 motion-safe:group-hover:scale-110">
                          <Icon
                            aria-hidden="true"
                            className="h-5 w-5 text-primary"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">
                            {fact.label}
                          </div>
                          <div className="font-semibold">
                            {withAge(fact.value)}
                          </div>
                        </div>
                        {fact.detail && (
                          <div className="text-xs text-muted-foreground">
                            {fact.detail}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
