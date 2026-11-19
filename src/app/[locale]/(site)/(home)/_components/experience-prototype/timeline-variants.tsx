'use client'

// PROTOTYPE: variations on timeline B (C, D, E). Delete me.
import type { Experience } from '@/lib/site-data'
import { useState } from 'react'
import { formatDuration, parsePeriod } from './months'

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="relative pl-5">
          <span aria-hidden="true" className="absolute left-0 text-primary">
            ▸
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Title({ job }: { job: Experience }) {
  return (
    <>
      <h3 className="text-xl font-bold">
        {job.company}{' '}
        <span className="text-sm font-medium text-primary">[{job.level}]</span>
      </h3>
      <p className="text-sm text-muted-foreground">{job.role}</p>
    </>
  )
}

function Toggle({
  job,
  isOpen,
  onToggle,
}: {
  job: Experience
  isOpen: boolean
  onToggle: () => void
}) {
  if (!job.details?.length) {
    return null
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-3 font-serif text-sm italic text-primary hover:underline"
    >
      {isOpen ? 'Ver resumo' : `Ver tudo (${job.details.length})`}
    </button>
  )
}

// C: big year on the left, rail in the middle, content on the right.
function RailEntry({ job, isFirst }: { job: Experience; isFirst: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const year = job.period.match(/\d{4}/g)?.at(-1)
  const isCurrent = job.period.includes('Atual')
  return (
    <li className="relative grid gap-2 pb-12 pl-8 last:pb-0 md:grid-cols-[150px_1fr] md:gap-10 md:pl-0">
      <div className="md:text-right">
        <p className="text-4xl font-black leading-none text-primary/80 md:text-5xl">
          {isCurrent ? 'Hoje' : year}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{job.period}</p>
        <p className="text-xs text-muted-foreground">
          {formatDuration(parsePeriod(job.period).months)}
        </p>
      </div>
      <span
        aria-hidden="true"
        className={`absolute top-2 -left-[7px] size-3.5 rounded-full border-2 border-primary md:left-[calc(150px+1.25rem-7px)] ${isFirst ? 'bg-primary' : 'bg-background'}`}
      />
      <div>
        <Title job={job} />
        <div className="mt-4">
          <Bullets
            items={isOpen && job.details?.length ? job.details : job.highlights}
          />
        </div>
        <Toggle
          job={job}
          isOpen={isOpen}
          onToggle={() => setIsOpen((v) => !v)}
        />
      </div>
    </li>
  )
}

export function VariantRail({ jobs }: { jobs: Experience[] }) {
  return (
    <ol className="relative ml-2 border-l-2 border-border md:ml-0 md:border-l-0 md:before:absolute md:before:top-0 md:before:bottom-0 md:before:left-[calc(150px+1.25rem)] md:before:w-0.5 md:before:bg-border">
      {jobs.map((job, index) => (
        <RailEntry
          key={`${job.company}-${job.period}`}
          job={job}
          isFirst={index === 0}
        />
      ))}
    </ol>
  )
}

// D: timeline whose entries are cards, with numbers pulled out as chips.
function metricsOf(job: Experience) {
  const text = job.highlights.join(' ')
  return [...text.matchAll(/\d+(?:[.,]\d+)?\s?(?:x|%)/g)]
    .map((m) => m[0])
    .slice(0, 3)
}

function CardEntry({ job, isFirst }: { job: Experience; isFirst: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const metrics = metricsOf(job)
  return (
    <li className="relative pb-8 pl-8 last:pb-0 md:pl-12">
      <span
        aria-hidden="true"
        className={`absolute top-7 -left-[7px] size-3.5 rounded-full border-2 border-primary ${isFirst ? 'bg-primary' : 'bg-background'}`}
      />
      <div className="rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Title job={job} />
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-mono text-primary">{job.period}</p>
            <p>{formatDuration(parsePeriod(job.period).months)}</p>
          </div>
        </div>
        {metrics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {metrics.map((metric) => (
              <span
                key={metric}
                className="rounded-md bg-primary/10 px-2 py-1 font-mono text-sm font-semibold text-primary"
              >
                {metric}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Bullets
            items={isOpen && job.details?.length ? job.details : job.highlights}
          />
        </div>
        <Toggle
          job={job}
          isOpen={isOpen}
          onToggle={() => setIsOpen((v) => !v)}
        />
      </div>
    </li>
  )
}

export function VariantCards({ jobs }: { jobs: Experience[] }) {
  return (
    <ol className="ml-2 border-l-2 border-border">
      {jobs.map((job, index) => (
        <CardEntry
          key={`${job.company}-${job.period}`}
          job={job}
          isFirst={index === 0}
        />
      ))}
    </ol>
  )
}

// E: collapsed timeline, only the current job open; click a node to expand.
function FoldEntry({
  job,
  isOpen,
  onToggle,
}: {
  job: Experience
  isOpen: boolean
  onToggle: () => void
}) {
  const [isDetailed, setIsDetailed] = useState(false)
  return (
    <li className="relative pb-6 pl-8 last:pb-0 md:pl-12">
      <span
        aria-hidden="true"
        className={`absolute top-3 -left-[7px] size-3.5 rounded-full border-2 border-primary ${isOpen ? 'bg-primary' : 'bg-background'}`}
      />
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50"
      >
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-lg font-bold">
            {job.company}{' '}
            <span className="text-sm font-medium text-primary">
              [{job.level}]
            </span>
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {job.period} {isOpen ? '−' : '+'}
          </span>
        </span>
        <span className="block text-sm text-muted-foreground">{job.role}</span>
        {!isOpen && (
          <span className="mt-1 line-clamp-1 block text-sm text-muted-foreground/70">
            {job.highlights[0]}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="px-3 pt-3">
          <Bullets
            items={
              isDetailed && job.details?.length ? job.details : job.highlights
            }
          />
          <Toggle
            job={job}
            isOpen={isDetailed}
            onToggle={() => setIsDetailed((v) => !v)}
          />
        </div>
      )}
    </li>
  )
}

export function VariantFold({ jobs }: { jobs: Experience[] }) {
  const [open, setOpen] = useState<string | null>(
    jobs[0] ? `${jobs[0].company}-${jobs[0].period}` : null
  )
  return (
    <ol className="ml-2 border-l-2 border-border">
      {jobs.map((job) => {
        const id = `${job.company}-${job.period}`
        return (
          <FoldEntry
            key={id}
            job={job}
            isOpen={open === id}
            onToggle={() => setOpen(open === id ? null : id)}
          />
        )
      })}
    </ol>
  )
}
