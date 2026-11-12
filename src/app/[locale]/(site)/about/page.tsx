import { CautionTape } from '@/components/common/caution-tape'
import { generateLocalizedMetadata } from '@/lib/metadata'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AboutHero, Philosophy } from './_components'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return await generateLocalizedMetadata(locale, 'about')
}

export default async function AboutPage() {
  const t = await getTranslations('maintenance')
  return (
    <>
      <AboutHero />
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          inert={true}
          className="pointer-events-none select-none opacity-25 blur-[2px]"
        >
          <Philosophy />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-32 w-full">
            <CautionTape
              label={t('tape')}
              size="lg"
              repeat={12}
              className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 -rotate-3"
            />
          </div>
        </div>
      </div>
    </>
  )
}
