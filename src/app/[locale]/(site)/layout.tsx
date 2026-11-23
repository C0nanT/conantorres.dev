import { WhatsappFloatingButton } from '@/components/common'
import { Footer, Navigation } from '@/components/layout'
import { PageIndex } from '@/components/layout/page-index'
import { RouteTransition } from '@/components/layout/route-transition'
import { Suspense } from 'react'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex flex-col">
        <Suspense fallback={<div className="h-16 bg-background" />}>
          <Navigation />
        </Suspense>
        <main className="min-h-screen">
          <RouteTransition>{children}</RouteTransition>
        </main>
        <Footer />
      </div>
      <Suspense fallback={null}>
        <PageIndex />
      </Suspense>
      <WhatsappFloatingButton />
    </>
  )
}
