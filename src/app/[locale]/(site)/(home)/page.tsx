import { projects } from '@/lib/projects'
import {
  ExperienceSection,
  HeroSection,
  RecommendationsSection,
  StudyingTeaser,
  YouTubeChannels,
} from './_components'

export default function HomePage() {
  return (
    <>
      <HeroSection projectsCount={projects.length} />
      <ExperienceSection />
      <RecommendationsSection />
      <YouTubeChannels />
      <StudyingTeaser />
    </>
  )
}
