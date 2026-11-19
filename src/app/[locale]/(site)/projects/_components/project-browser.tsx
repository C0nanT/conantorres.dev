'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Project } from '@/lib/projects'
import { cn } from '@/lib/styling'
import { Code2, ExternalLink, Github } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState } from 'react'

function ProjectCover({ project }: { project: Project }) {
  if (project.image) {
    return (
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={project.image}
          alt=""
          fill={true}
          sizes="(min-width: 1024px) 700px, 100vw"
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <div
      aria-hidden={true}
      className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-muted to-muted/40"
    >
      <Code2 className="h-10 w-10 text-muted-foreground/60" />
    </div>
  )
}

function ProjectDetail({ project }: { project: Project }) {
  const t = useTranslations('projects')

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border">
      <ProjectCover project={project} />
      <div className="flex flex-col gap-4 p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold lg:text-3xl">{project.name}</h2>
          {project.language && (
            <Badge variant="secondary">{project.language}</Badge>
          )}
        </div>

        {project.description && (
          <p className="text-muted-foreground">{project.description}</p>
        )}

        {project.stack.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={t('stack')}>
            {project.stack.map((tech) => (
              <li key={tech}>
                <Badge variant="outline" className="text-xs">
                  {tech}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild={true} variant="outline" size="sm">
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('codeLabel', { name: project.name })}
            >
              <Github aria-hidden={true} className="h-4 w-4" />
              {t('code')}
            </a>
          </Button>
          {project.demoUrl && (
            <Button asChild={true} variant="outline" size="sm">
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('demoLabel', { name: project.name })}
              >
                <ExternalLink aria-hidden={true} className="h-4 w-4" />
                {t('demo')}
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProjectBrowser({ projects }: { projects: Project[] }) {
  const [selectedName, setSelectedName] = useState(projects[0]?.name)
  const selected = projects.find((project) => project.name === selectedName)

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      {/* mobile: one scrollable row bleeding to the screen edges; each tab
          keeps its width (shrink-0), or the labels pile on top of each other */}
      <ul className="flex gap-2 overflow-x-auto pb-2 max-md:-mx-4 max-md:px-4 md:flex-col md:overflow-visible md:pb-0">
        {projects.map((project) => (
          <li key={project.name} className="shrink-0">
            <button
              type="button"
              aria-pressed={project.name === selectedName}
              onClick={() => setSelectedName(project.name)}
              className={cn(
                'w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                project.name === selectedName
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              {project.name}
            </button>
          </li>
        ))}
      </ul>
      {selected && <ProjectDetail project={selected} />}
    </div>
  )
}
