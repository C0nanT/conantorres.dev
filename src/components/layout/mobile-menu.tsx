'use client'

import { Link } from '@/lib/navigation'
import { getContactEmail, site } from '@/lib/site-data'
import { cn } from '@/lib/styling'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type * as React from 'react'
import { RiMailLine, RiWhatsappLine } from 'react-icons/ri'

type Icon = React.ComponentType<{ className?: string }>

interface MobileMenuProps {
  items: Array<{ name: string; href: string; icon: Icon; isActive: boolean }>
  socials: Array<{ name: string; href: string; icon: Icon }>
  onClose: () => void
}

const WHATSAPP_URL = `https://wa.me/${site.contact.whatsapp}`
const MAIL_URL = `mailto:${getContactEmail()}`

const ICON_LINK_CLASS =
  'flex h-10 w-10 items-center justify-center rounded-2xl border border-border/40'

export function MobileMenu({ items, socials, onClose }: MobileMenuProps) {
  const t = useTranslations('navigation')
  // Enter transition starts one frame after mount.
  const [isEntered, setIsEntered] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="md:hidden absolute inset-x-0 top-full z-50">
      <button
        type="button"
        aria-label={t('closeMenu')}
        onClick={onClose}
        className={cn(
          'fixed inset-0 top-[73px] bg-background/60 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none',
          isEntered ? 'opacity-100' : 'opacity-0'
        )}
      />
      <div
        className={cn(
          'relative mx-3 mt-2 origin-top rounded-3xl border border-border/40 bg-card p-2 shadow-xl transition-all duration-300 ease-out motion-reduce:transition-none',
          isEntered
            ? 'translate-y-0 scale-100 opacity-100'
            : '-translate-y-2 scale-95 opacity-0'
        )}
      >
        <nav className="flex flex-col">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors',
                item.isActive
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-2 flex items-center justify-center gap-3 border-t border-dotted border-border/50 p-2 pt-3">
          <div className="flex items-center gap-2">
            {socials.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={ICON_LINK_CLASS}
              >
                <social.icon className="h-4 w-4" />
                <span className="sr-only">{social.name}</span>
              </a>
            ))}
            <a href={MAIL_URL} className={ICON_LINK_CLASS}>
              <RiMailLine className="h-4 w-4" />
              <span className="sr-only">{t('email')}</span>
            </a>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <RiWhatsappLine className="h-4 w-4" />
            {t('chat')}
          </a>
        </div>
      </div>
    </div>
  )
}
