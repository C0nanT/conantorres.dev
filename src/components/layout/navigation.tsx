'use client'

import { SocialButton } from '@/components/common/social-button'
import { NavigationCard } from '@/components/layout/navigation-card'
import { NavigationDock } from '@/components/layout/navigation-dock'
import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/lib/navigation'
import { getSocialLinksForNav } from '@/lib/site-data'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { FaLinkedin } from 'react-icons/fa6'
import {
  RiBook2Line,
  RiCloseLine,
  RiFileListLine,
  RiFolderLine,
  RiHomeLine,
  RiMenuLine,
  RiUserLine,
} from 'react-icons/ri'
import { LogoHorizontal } from '../common'

const getNavigationItems = (t: (key: string) => string) => [
  { name: t('navigation.home'), href: '/', icon: RiHomeLine },
  { name: t('navigation.about'), href: '/about', icon: RiUserLine },
  { name: t('navigation.projects'), href: '/projects', icon: RiFolderLine },
  {
    name: t('navigation.certificates'),
    href: '/certificates',
    icon: RiFileListLine,
  },
  { name: t('navigation.books'), href: '/books', icon: RiBook2Line },
]

const getSocialIcon = (name: string) => {
  switch (name) {
    case 'Linkedin':
      return FaLinkedin
    default:
      return FaLinkedin
  }
}

const socialLinks = getSocialLinksForNav().map((link) => ({
  ...link,
  icon: getSocialIcon(link.name),
}))

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations()

  const navigationItems = getNavigationItems(t)

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const navigationData = navigationItems.map((item) => ({
    name: item.name,
    href: item.href,
    icon: item.icon,
    isActive: isActive(item.href),
  }))

  return (
    <header className="sticky top-0 z-50 w-full bg-card border-b-2 py-1 border-dotted border-border/40">
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 group [-webkit-tap-highlight-color:transparent]"
        >
          <LogoHorizontal isPressable={true} />
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          <NavigationDock items={navigationData} />
        </nav>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden h-9 w-9 p-0 hover:bg-muted/50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <RiCloseLine className="h-5 w-5" />
          ) : (
            <RiMenuLine className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile Navigation - Full Screen */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <LogoHorizontal />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-muted/50"
                onClick={() => setIsOpen(false)}
              >
                <RiCloseLine className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col justify-center px-6 py-8">
              <nav className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
                {navigationItems.map((item) => (
                  <NavigationCard
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.name}
                    isActive={isActive(item.href)}
                    onClick={() => setIsOpen(false)}
                  />
                ))}
              </nav>

              {/* Mobile Social Links */}
              <div className="mt-8 pt-8 border-t border-border/30 max-w-sm mx-auto w-full">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6 text-center">
                  {t('navigation.socialMedia')}
                </p>
                <div className="flex items-center justify-center gap-6">
                  {socialLinks.map((link) => (
                    <SocialButton
                      key={link.href}
                      href={link.href}
                      icon={link.icon}
                      label={link.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
