import { site } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import { LogoIcon } from './logo-icon'

interface Props {
  className?: string
  isPressable?: boolean
}

export function LogoHorizontal({ className, isPressable = false }: Props) {
  return (
    <span
      role="img"
      aria-label={site.profile.displayName}
      className={cn(
        'group/logo flex items-center gap-3',
        isPressable && 'group/press',
        className
      )}
    >
      <LogoIcon className="h-10" isPressable={isPressable} />
      <span
        aria-hidden="true"
        className="text-2xl font-bold tracking-tight text-foreground transition-[letter-spacing] duration-300 ease-out group-hover/logo:tracking-[0.01em] motion-reduce:transition-none"
      >
        {site.site.name}
      </span>
    </span>
  )
}
