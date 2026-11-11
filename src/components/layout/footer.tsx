import { LogoHorizontal } from '@/components/common'
import { CopyEmailButton } from '@/components/layout/copy-email-button'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/lib/navigation'
import { site } from '@/lib/site-data'
import { ArrowUpRight, Github, Linkedin, MapPin } from 'lucide-react'

interface FooterLink {
  name: string
  href: string
  external?: boolean
  copy?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: 'Páginas',
    links: [
      { name: 'Início', href: '/' },
      { name: 'Sobre', href: '/about' },
    ],
  },
  {
    title: 'Redes',
    links: [
      {
        name: 'GitHub',
        href: site.social.github.url,
        external: true,
      },
      {
        name: 'Linkedin',
        href: site.social.linkedin.url,
        external: true,
      },
    ],
  },
  {
    title: 'Contato',
    links: [
      {
        name: site.contact.email,
        href: `mailto:${site.contact.email}`,
        copy: true,
      },
    ],
  },
]

// Emoji flags sit on a different baseline than the surrounding text, so the
// flag is rendered in its own box to keep it vertically centred.
function splitTrailingFlag(text: string): [string, string] {
  const match = text.match(/^(.*?)\s*(\p{Regional_Indicator}{2})$/u)
  return match ? [match[1] ?? text, match[2] ?? ''] : [text, '']
}

export function Footer() {
  const { profile, social } = site
  const [locationText, locationFlag] = splitTrailingFlag(
    profile.location.display
  )

  return (
    <footer className="border-t-2 border-dotted border-border/40 bg-background">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand Section - Takes more space on larger screens */}
          <div className="col-span-2 lg:col-span-1 space-y-6">
            <div className="flex items-center">
              <LogoHorizontal />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {profile.tagline}
            </p>

            <a
              href={profile.location.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center space-x-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap leading-none">
                {locationText}
              </span>
              {locationFlag && (
                <span
                  className="text-base leading-none pl-20"
                  aria-hidden="true"
                >
                  {locationFlag}
                </span>
              )}
            </a>

            {/* Social Icons */}
            <div className="flex items-center space-x-4">
              <Link
                href={social.github.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-[color,transform] duration-200 p-1 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-125"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </Link>
              <Link
                href={social.linkedin.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-[color,transform] duration-200 p-1 motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-125"
                aria-label="Linkedin"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground tracking-wide">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={`${link.href}-${i}`}>
                    {link.copy ? (
                      <CopyEmailButton email={link.name} />
                    ) : (
                      <Link
                        href={link.href}
                        {...(link.external
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className="text-sm text-muted-foreground hover:text-primary transition-[color,transform] duration-200 flex items-center group motion-safe:hover:translate-x-1"
                      >
                        <span>{link.name}</span>
                        {link.external && (
                          <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-12 border-dotted border-border/40" />

        {/* Bottom Section */}
        <div className="flex flex-col items-start justify-between space-y-6 lg:flex-row lg:items-center lg:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {profile.displayName}. Todos os
            direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  )
}
