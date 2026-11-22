'use client'

import type { Experience } from '@/lib/site-data'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { RiInformationLine } from 'react-icons/ri'

// info icon beside the company name; its tooltip says what the company does.
// Opens on mouse hover and on click/tap (touch has no hover).
export function CompanyAbout({ job }: { job: Experience }) {
  const t = useTranslations('experience')
  const [isOpen, setIsOpen] = useState(false)
  if (!(job.sector && job.about)) {
    return null
  }

  // only a real mouse opens on hover: a tap also fires pointerenter, and
  // opening there would let the click that follows close it again
  const handlePointerEnter = (event: React.PointerEvent) => {
    if (event.pointerType === 'mouse') {
      setIsOpen(true)
    }
  }
  const handlePointerLeave = (event: React.PointerEvent) => {
    if (event.pointerType === 'mouse') {
      setIsOpen(false)
    }
  }

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild={true}>
        <button
          type="button"
          aria-label={t('aboutCompany', { company: job.company })}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          // flex: the button hugs the icon, with no line-height space under
          // it that would push the balloon away when it opens below
          className="flex cursor-default rounded-full text-muted-foreground"
        >
          <RiInformationLine className="size-5" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="top"
          align="start"
          // room for the 8px arrow (pulled 2.5px into the box below)
          sideOffset={8}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="group/tip z-50 max-w-64 rounded-md bg-foreground px-3 py-2 text-xs leading-relaxed text-background shadow-lg outline-none motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:zoom-in-95"
        >
          <p className="font-semibold">{job.sector}</p>
          <p>{job.about}</p>
          {/* pulled 2.5px into the box so no seam shows between them, and
              1px right to line up with the icon. Opening below, Radix turns
              the arrow 180°, so its x axis flips: -x there is right */}
          <PopoverPrimitive.Arrow
            className="-translate-y-[2.5px] fill-foreground group-data-[side=bottom]/tip:-translate-x-px group-data-[side=top]/tip:translate-x-px"
            width={16}
            height={8}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
