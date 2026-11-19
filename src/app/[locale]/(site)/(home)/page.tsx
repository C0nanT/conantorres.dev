import { projects } from '@/lib/projects'
import {
  ExperienceSection,
  HeroSection,
  RecommendationsSection,
  YouTubeChannels,
} from './_components'
import { SectionDivider } from './_components/section-divider'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  return (
    <>
      <HeroSection projectsCount={projects.length} />
      <ExperienceSection variant={variant} />
      <SectionDivider />
      <RecommendationsSection />
      <SectionDivider />
      <YouTubeChannels />
    </>
  )
}
