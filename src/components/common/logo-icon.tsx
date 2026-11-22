import { site } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import Image from 'next/image'

interface Props {
  className?: string
  // keycap press, triggered by an ancestor with `group/press`; the depth
  // comes from `--press-depth` (4px by default, set it smaller on small icons)
  isPressable?: boolean
}

// sinks down and slightly left (the icon leans right), onto its own shadow
const PRESSABLE =
  '[--press-depth:4px] drop-shadow-[-1px_var(--press-depth)_0_hsl(var(--foreground)/0.25)] transition-[transform,filter] duration-100 ease-out group-active/press:-translate-x-px group-active/press:translate-y-[var(--press-depth)] group-active/press:drop-shadow-[0_0_0_hsl(var(--foreground)/0.25)] motion-reduce:transition-none'

export function LogoIcon({ className, isPressable = false }: Props) {
  return (
    <Image
      src="/android-chrome-512x512.png"
      alt={site.profile.displayName}
      width={512}
      height={512}
      className={cn('w-auto h-10', isPressable && PRESSABLE, className)}
    />
  )
}
