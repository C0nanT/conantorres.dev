'use client'

import { CautionTape } from '@/components/common/caution-tape'
import * as FancyButton from '@/components/common/fancy-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/lib/navigation'
import { site } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import {
  ArrowRight,
  Award,
  Briefcase,
  Code2,
  FolderGit2,
  GraduationCap,
  type LucideIcon,
  MapPin,
  Rocket,
  Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import type { ComponentType } from 'react'
import { LiaBookSolid } from 'react-icons/lia'
import { AvailableBadge } from './available-badge'
import { IntroAudio } from './intro-audio'

interface HeroHighlight {
  label: string
  image?: string
  icon?: ComponentType<{ className?: string }>
}

interface HeroStat {
  label: string
  value: string
  icon: LucideIcon
  href?: string
  isUnderMaintenance?: boolean
}

interface HeroSectionProps {
  projectsCount: number
}

export function HeroSection({ projectsCount }: HeroSectionProps) {
  const t = useTranslations('hero')
  const { profile } = site

  const stats: HeroStat[] = [
    {
      label: t('stats.projects'),
      value: String(projectsCount),
      icon: FolderGit2,
    },
    {
      label: t('stats.certifications'),
      value: profile.stats.certifications,
      icon: Award,
      href: '/certificates',
    },
    {
      label: t('stats.experience'),
      value: profile.stats.yearsExperience,
      icon: Briefcase,
    },
    {
      label: t('stats.freelances'),
      value: profile.stats.freelances,
      icon: Rocket,
      isUnderMaintenance: true,
    },
  ]

  const highlights: HeroHighlight[] = [
    {
      label: site.content.hero.highlights.architecture,
      icon: Code2,
    },
    {
      label: site.content.hero.highlights.people,
      icon: Users,
    },
    { label: site.content.hero.highlights.ai, image: '/icons/claude-code.svg' },
    {
      label: site.content.hero.highlights.learning,
      icon: LiaBookSolid,
    },
  ]

  return (
    <section className="hero-section">
      <div
        className={cn(
          'relative max-w-6xl mx-auto px-8 py-16 lg:py-20 border-x-2 border-transparent',
          'before:absolute before:inset-y-0 before:-left-0.5 before:border-l-2',
          'after:absolute after:inset-y-0 after:-right-0.5 after:border-r-2',
          'before:border-dotted before:border-border/40 after:border-dotted after:border-border/40',
          'before:pointer-events-none after:pointer-events-none',
          'before:[mask-image:linear-gradient(to_bottom,black_80%,transparent)]',
          'after:[mask-image:linear-gradient(to_bottom,black_80%,transparent)]'
        )}
      >
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="px-3 py-1">
                <MapPin className="mr-1 h-3 w-3" />
                {profile.location.display}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Briefcase className="mr-1 h-3 w-3" />
                {profile.role}
              </Badge>
            </div>

            {/* Main Heading */}
            <div className="space-y-6">
              <div className="text-subtitle">{profile.subtitle}</div>
              <h1 className="text-display">
                {profile.firstName}{' '}
                <span className="gradient-text">{profile.lastName}</span>
              </h1>
              <p className="text-body-large text-muted-foreground max-w-2xl">
                {site.content.hero.description}
              </p>
            </div>

            {/* Highlights */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {highlights.map((highlight) => {
                const Icon = highlight.icon

                return (
                  <div
                    key={highlight.label}
                    className="group flex items-center gap-2 transition-transform duration-200 ease-out motion-safe:hover:translate-x-1"
                  >
                    {Icon && (
                      <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:scale-125 motion-safe:group-hover:-rotate-6" />
                    )}
                    {highlight.image && (
                      <Image
                        src={highlight.image}
                        alt=""
                        width={16}
                        height={16}
                        className="shrink-0 transition-transform duration-200 motion-safe:group-hover:scale-125"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {highlight.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
              <FancyButton.Root
                size="lg"
                type="button"
                disabled={true}
                className="group"
              >
                <FancyButton.Icon as={GraduationCap} className="mr-2" />
                {t('cta.courses')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </FancyButton.Root>
              {profile.introAudio && <IntroAudio src={profile.introAudio} />}
            </div>
          </div>

          {/* Right Column - Image & Stats */}
          <div className="space-y-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="group aspect-square w-full max-w-md mx-auto relative overflow-hidden rounded-2xl bg-white from-muted/50 to-muted border border-border/20 shadow-[inset_0_0_40px_rgba(0,0,0,0.15)]">
                <Image
                  src={profile.images.hero}
                  alt={`${profile.displayName} - ${profile.jobTitle}`}
                  fill={true}
                  className="select-none object-cover object-center opacity-20 blur-[1.5px] transition-transform duration-700 ease-out motion-safe:group-hover:scale-105"
                  priority={true}
                  sizes="(max-width: 768px) 100vw, 448px"
                />
                <CautionTape
                  label={t('stats.maintenance')}
                  size="lg"
                  repeat={4}
                  className="absolute inset-x-[-15%] top-1/2 -translate-y-1/2 -rotate-[8deg]"
                />
              </div>

              <AvailableBadge />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => {
                const Icon = stat.icon
                const card = (
                  <Card
                    className={cn(
                      'tech-card group relative h-full overflow-hidden p-4',
                      stat.href && 'hover-interactive cursor-pointer'
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,hsl(var(--primary)/0.14),transparent_65%)]" />
                      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-primary/15" />
                      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-primary/10" />
                      <Icon
                        strokeWidth={1.5}
                        className="absolute right-2 top-2 h-12 w-12 rotate-12 text-primary/25 transition-[transform,color] duration-300 ease-out group-hover:text-primary/40 motion-safe:group-hover:rotate-[24deg] motion-safe:group-hover:scale-110"
                      />
                    </div>
                    <CardContent
                      className={cn(
                        'relative p-3',
                        stat.isUnderMaintenance &&
                          'select-none opacity-30 blur-[1.5px]'
                      )}
                      aria-hidden={stat.isUnderMaintenance}
                    >
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {stat.label}
                      </div>
                    </CardContent>
                    {stat.isUnderMaintenance && (
                      <CautionTape
                        label={t('stats.maintenance')}
                        className="absolute inset-x-[-15%] top-1/2 -translate-y-1/2 -rotate-[8deg]"
                      />
                    )}
                  </Card>
                )

                if (stat.href) {
                  return (
                    <Link key={stat.label} href={stat.href} className="block">
                      {card}
                    </Link>
                  )
                }

                return <div key={stat.label}>{card}</div>
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]">
          <div
            className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-muted/20 to-muted/10 opacity-20"
            style={{
              clipPath:
                'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
            }}
          />
        </div>
      </div>
    </section>
  )
}
