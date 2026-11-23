import { projects } from '@/lib/projects'
import { getTranslations } from 'next-intl/server'
import { ProjectBrowser } from './project-browser'

export async function ProjectList() {
  const t = await getTranslations('projects')

  return (
    <section className="section-tone py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4">
        <header className="mb-10 max-w-3xl space-y-3">
          <h1 className="text-3xl font-bold lg:text-4xl">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('description')}</p>
        </header>

        {projects.length === 0 ? (
          <p className="text-center text-muted-foreground">{t('empty')}</p>
        ) : (
          <ProjectBrowser projects={projects} />
        )}
      </div>
    </section>
  )
}
