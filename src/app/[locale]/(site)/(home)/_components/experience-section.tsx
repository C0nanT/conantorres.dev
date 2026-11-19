import { site } from '@/lib/site-data'
import { useTranslations } from 'next-intl'
import { RiTerminalBoxLine } from 'react-icons/ri'
import { ExperienceItem } from './experience-item'

export function ExperienceSection() {
  const t = useTranslations('experience')

  return (
    <section className="bg-gradient-to-b from-background to-muted/30 pt-16 pb-8 lg:pt-20 lg:pb-10">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="group relative mb-6 w-fit text-3xl font-bold underline decoration-transparent decoration-2 underline-offset-8 transition-colors duration-300 ease-out hover:text-primary hover:decoration-primary motion-reduce:transition-none lg:text-4xl">
          {t('titlePrefix')}{' '}
          <span className="gradient-text transition-colors duration-300 ease-out group-hover:text-primary motion-reduce:transition-none">
            {t('titleHighlight')}
          </span>
          {/* clipped at the text's right edge, so the terminal icon slides out
              from behind the title */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-full -translate-y-1/2 overflow-hidden pl-3 max-md:hidden"
          >
            <RiTerminalBoxLine className="size-7 -translate-x-[calc(100%+0.75rem)] text-primary opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:translate-x-0 motion-reduce:transition-opacity lg:size-8" />
          </span>
        </h2>

        <ol>
          {site.experience.map((job) => (
            <ExperienceItem key={`${job.company}-${job.period}`} job={job} />
          ))}
        </ol>
      </div>
    </section>
  )
}
