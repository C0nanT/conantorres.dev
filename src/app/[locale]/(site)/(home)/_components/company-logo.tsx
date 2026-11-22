import { LogoIcon } from '@/components/common/logo-icon'
import Image from 'next/image'

// Logos that are components instead of files: `logo` in site.json names one
// of these keys. Any value starting with "/" is a file in public/.
const LOGO_COMPONENTS: Record<
  string,
  React.ComponentType<{
    className?: string
    isPressable?: boolean
  }>
> = {
  'logo-icon': LogoIcon,
}

export function CompanyLogo({ logo }: { logo: string }) {
  const Component = LOGO_COMPONENTS[logo]
  if (Component) {
    // decorative: the company name sits right next to it
    return (
      <span
        aria-hidden="true"
        className="group/press relative block cursor-pointer select-none"
      >
        <Component
          className="size-6 object-contain [--press-depth:2px]"
          isPressable={true}
        />
      </span>
    )
  }
  return (
    <Image
      src={logo}
      alt=""
      width={24}
      height={24}
      className="relative size-6 object-contain"
    />
  )
}
