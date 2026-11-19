'use client'

// PROTOTYPE B: vertical timeline, period on the rail, details inline.
import type { Experience } from '@/lib/site-data'
import { useState } from 'react'
import { formatDuration, parsePeriod } from './months'

function Entry({ job, isFirst }: { job: Experience; isFirst: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const items = isOpen && job.details?.length ? job.details : job.highlights
  return (
    <li className="relative pb-12 pl-8 last:pb-0 md:pl-12">
      <span
        aria-hidden="true"
        className={`absolute top-1.5 -left-[7px] size-3.5 rounded-full border-2 border-primary ${isFirst ? 'bg-primary' : 'bg-background'}`}
      />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs text-primary">
          {job.period}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDuration(parsePeriod(job.period).months)}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-bold">
        {job.company}{' '}
        <span className="text-sm font-medium text-primary">[{job.level}]</span>
      </h3>
      <p className="text-sm text-muted-foreground">{job.role}</p>
      <ul className="mt-4 space-y-2 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="relative pl-5">
            <span aria-hidden="true" className="absolute left-0 text-primary">
              ▸
            </span>
            {item}
          </li>
        ))}
      </ul>
      {job.details?.length ? (
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="mt-3 font-serif text-sm italic text-primary hover:underline"
        >
          {isOpen ? 'Ver resumo' : `Ver tudo (${job.details.length})`}
        </button>
      ) : null}
    </li>
  )
}

export function VariantTimeline({ jobs }: { jobs: Experience[] }) {
  return (
    <ol className="ml-2 border-l-2 border-border">
      {jobs.map((job, index) => (
        <Entry
          key={`${job.company}-${job.period}`}
          job={job}
          isFirst={index === 0}
        />
      ))}
    </ol>
  )
}
