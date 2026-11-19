import { projects } from '@/lib/projects'
import {
  ExperienceSection,
  HeroSection,
  RecommendationsSection,
  YouTubeChannels,
} from './_components'
import { SectionDivider } from './_components/section-divider'

export default function HomePage() {
  return (
    <>
      <HeroSection projectsCount={projects.length} />
      <ExperienceSection />
      <SectionDivider />
      <RecommendationsSection />
      <SectionDivider />
      <YouTubeChannels />
    </>
  )
}
