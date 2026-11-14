import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'standalone',
  // Trace from this folder even when a parent folder has its own lockfile
  // (e.g. a worktree), so server.js lands at the root of .next/standalone.
  outputFileTracingRoot: import.meta.dirname,
  images: {
    // 90 is the hero photo (src/app/[locale]/(site)/(home)/_components).
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  transpilePackages: ['next-intl'],
  experimental: {
    optimizePackageImports: ['next-intl'],
  },
}

export default withNextIntl(config)
