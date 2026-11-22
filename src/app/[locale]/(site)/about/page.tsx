import { generateLocalizedMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import { AboutHero, StudyingSection } from './_components'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return await generateLocalizedMetadata(locale, 'about')
}

// Rendered per request: the studying section shows the book's saved reading
// progress (see book-progress.ts), so a deploy never serves build-time numbers.
export default async function AboutPage() {
  await connection()
  return (
    <>
      <AboutHero />
      <StudyingSection />
    </>
  )
}
